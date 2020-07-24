#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <errno.h>
#include <string.h>
#include <emscripten.h>

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

EMSCRIPTEN_KEEPALIVE
int extract_thumbnail(
    const char *raw_data,
    size_t raw_size,
    char **thumb_data,
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

  return err;
}
