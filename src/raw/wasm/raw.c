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
int extract_thumbnail(const char *raw_path, const char *thumb_path)
{
  int err = EXIT_SUCCESS;

  // reset globals
  raw_image = 0;
  image = 0;
  oprof = 0;
  meta_data = 0;

  ifp = fopen(raw_path, "rb");
  if (!ifp)
  {
    fprintf(stderr, "Failed to open %s: %s\n", raw_path, strerror(errno));
    err = EXIT_FAILURE;
    goto cleanup;
  }

  ofp = fopen(thumb_path, "wb");
  if (!ofp)
  {
    fprintf(stderr, "Failed to open %s: %s\n", thumb_path, strerror(errno));
    err = EXIT_FAILURE;
    goto cleanup;
  }

  // identify the ifp format
  identify();

  if (!thumb_offset)
  {
    fprintf(stderr, "Thumbnail not found in %s\n", thumb_path);
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
