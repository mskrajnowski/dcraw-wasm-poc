export interface RawModule extends EmscriptenModule {
  FS: typeof FS
  ccall: typeof ccall
  cwrap: typeof cwrap
  getValue: typeof getValue
}

declare const createModule: EmscriptenModuleFactory<RawModule>
export default createModule
