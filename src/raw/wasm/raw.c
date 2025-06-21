#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <errno.h>
#include <string.h>
#include <emscripten.h>

#define STB_IMAGE_IMPLEMENTATION
#define STBI_ONLY_JPEG
#define STBI_NO_STDIO
#define STBI_NO_LINEAR
#define STBI_NO_HDR
#include "stb_image.h"

#define STB_IMAGE_WRITE_IMPLEMENTATION
#define STBI_WRITE_NO_STDIO
#include "stb_image_write.h"

#define STB_IMAGE_RESIZE_IMPLEMENTATION
#include "stb_image_resize.h"

// dcraw global variables that we need to set/access
extern FILE *ifp, *ofp;
extern const char *ifname;
extern unsigned short *raw_image, (*image)[4];
extern unsigned *oprof;
extern char *meta_data;
extern off_t thumb_offset;

// dcraw functions used
extern void identify();
extern void (*write_thumb)();

int main(int argc, const char **argv)
{
  return 0;
}

void write_to_file(FILE *file, unsigned char *data, int size)
{
  fwrite(data, size, 1, file);
}

EMSCRIPTEN_KEEPALIVE
int resize_jpg(
    unsigned char *data,
    size_t data_size,
    size_t max_width,
    size_t max_height,
    int quality,
    unsigned char **resized_data,
    size_t *resized_data_size)
{
  int err = EXIT_SUCCESS;

  printf(
      "resize_jpg data=%p, data_size=%d, max_width=%d, max_height=%d, quality=%d\n",
      data, data_size, max_width, max_height, quality);

  int width = 0;
  int height = 0;
  int channels = 3;

  unsigned char *image = NULL;
  unsigned char *resized_image = NULL;
  FILE *resized_file = NULL;

  image = stbi_load_from_memory(data, data_size, &width, &height, &channels, 0);
  if (!image)
  {
    fprintf(stderr, "Failed to load image: %s\n", stbi_failure_reason());
    err = EXIT_FAILURE;
    goto cleanup;
  }

  printf(
      "jpg loaded image=%p, width=%d, height=%d, channels=%d\n",
      image, width, height, channels);

  float ratio = (float)width / (float)height;
  const int resized_width = ratio > 1.0 ? max_width : max_height * ratio;
  const int resized_height = ratio < 1.0 ? max_height : max_width / ratio;
  resized_image = malloc(resized_width * resized_height * channels);

  printf(
      "resizing ratio=%f, width=%d, height=%d\n",
      ratio, resized_width, resized_height);

  if (!stbir_resize_uint8(
          image, width, height, 0,
          resized_image, resized_width, resized_height, 0,
          channels))
  {
    fprintf(stderr, "Failed to resize image\n");
    err = EXIT_FAILURE;
    goto cleanup;
  }

  resized_file = open_memstream(resized_data, resized_data_size);
  if (!resized_file)
  {
    fprintf(stderr, "Failed to open file for writing the resized jpg: %s\n", strerror(errno));
    err = EXIT_FAILURE;
    goto cleanup;
  }

  if (!stbi_write_jpg_to_func(
          &write_to_file, resized_file,
          resized_width, resized_height, channels, resized_image,
          quality))
  {
    fprintf(stderr, "Failed to open file for writing the resized jpg: %s\n", strerror(errno));
    err = EXIT_FAILURE;
    goto cleanup;
  }

cleanup:
  if (image)
    stbi_image_free(image);
  if (resized_image)
    free(resized_image);
  if (resized_file)
    fclose(resized_file);

  if (err && *resized_data)
  {
    free(*resized_data);
    *resized_data = NULL;
  }

  return err;
}

EMSCRIPTEN_KEEPALIVE
int extract_thumbnail(
    const unsigned char *raw_data,
    size_t raw_size,
    unsigned char **thumb_data,
    size_t *thumb_size)
{
  int err = EXIT_SUCCESS;

  // reset globals
  raw_image = 0;
  image = 0;
  oprof = 0;
  meta_data = 0;

  ifp = fmemopen(raw_data, raw_size, "rb");
  if (!ifp)
  {
    fprintf(stderr, "Failed to open raw data: %s\n", strerror(errno));
    err = EXIT_FAILURE;
    goto cleanup;
  }

  ofp = open_memstream(thumb_data, thumb_size);
  if (!ofp)
  {
    fprintf(stderr, "Failed to open thumbnail data: %s\n", strerror(errno));
    err = EXIT_FAILURE;
    goto cleanup;
  }

  // identify the ifp format
  identify();

  if (!thumb_offset)
  {
    fprintf(stderr, "Thumbnail not found in raw data\n");
    err = EXIT_FAILURE;
    goto cleanup;
  }

  // write the thumbnail into ofp
  fseek(ifp, thumb_offset, SEEK_SET);
  (*write_thumb)();

cleanup:
  if (ifp)
    fclose(ifp);

  if (ofp)
    fclose(ofp);

  if (err && *thumb_data)
  {
    free(*thumb_data);
    *thumb_data = NULL;
    *thumb_size = 0;
  }

  return err;
}

EMSCRIPTEN_KEEPALIVE
int extract_thumbnail_resized(
    const unsigned char *raw_data,
    size_t raw_size,
    unsigned char **resized_data,
    size_t *resized_size,
    size_t max_width,
    size_t max_height,
    int quality)
{
  int err = EXIT_SUCCESS;
  unsigned char *thumb_data = NULL;
  size_t thumb_size = 0;

  if (extract_thumbnail(
          raw_data, raw_size,
          &thumb_data, &thumb_size))
  {
    fprintf(stderr, "Failed to extract thumbnail\n");
    err = EXIT_FAILURE;
    goto cleanup;
  }

  if (resize_jpg(
          thumb_data, thumb_size,
          max_width, max_height, quality,
          resized_data, resized_size))
  {
    fprintf(stderr, "Failed to resize thumbnail\n");
    err = EXIT_FAILURE;
    goto cleanup;
  }

cleanup:
  if (thumb_data)
    free(thumb_data);

  return err;
}
