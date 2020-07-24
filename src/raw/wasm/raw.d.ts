export interface RawModule extends EmscriptenModule {
  ccall: typeof ccall
  cwrap: typeof cwrap
  getValue: typeof getValue
  setValue: typeof setValue
}

declare const createModule: EmscriptenModuleFactory<RawModule>
export default createModule
