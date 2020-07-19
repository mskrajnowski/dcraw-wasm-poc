module = raw
module_files = $(module).js $(module).wasm.bin

# https://github.com/emscripten-core/emscripten/blob/1.39.19/src/settings.js
module_em_settings = \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=createModule \
	-s EXPORT_ES6=1 \
	-s USE_ES6_IMPORT_META=0 \
	-s "EXTRA_EXPORTED_RUNTIME_METHODS=['FS', 'ccall', 'cwrap', 'getValue']"

dcraw_ccflags = \
	-O4 \
	-std=c99 \
	-lm \
	-DNODEPS

# https://github.com/emscripten-core/emsdk/tree/1.39.19
em_sdk_version=1.39.19
em_sdk_url=https://github.com/emscripten-core/emsdk/archive/$(em_sdk_version).zip

build: clean_module $(module_files)
clean: clean_module clean_dcraw clean_em_sdk
.PHONY: build clean clean_module clean_dcraw clean_em_sdk

# module ----------------------------------------------------------------------
$(module_files): SHELL=bash
$(module_files): dcraw.c $(module).c em_sdk
	cd em_sdk && source emsdk_env.sh && cd .. && \
	emcc -o $(module).js $(module).c dcraw.c \
		$(dcraw_ccflags) \
		$(module_em_settings)

	# avoid parcel's .wasm loader by using .bin
	mv $(module).wasm $(module).wasm.bin

clean_module:
	rm -f $(module_files)

# dcraw -----------------------------------------------------------------------
dcraw.c:
	wget -O dcraw.c https://www.dechifro.org/dcraw/dcraw.c
	patch -u dcraw.c -i dcraw.patch

clean_dcraw:
	rm -f dcraw.c

# em_sdk ----------------------------------------------------------------------
em_sdk:
	wget -O em_sdk.zip "$(em_sdk_url)"
	unzip em_sdk.zip
	rm em_sdk.zip
	mv emsdk-$(em_sdk_version) em_sdk
	./em_sdk/emsdk install $(em_sdk_version)
	./em_sdk/emsdk activate $(em_sdk_version)

clean_em_sdk:
	rm -rf em_sdk
