// Resolves the app's extensionless relative imports ("./holds") to their .ts files, so a check can run an app
// module that imports others (registered by ts-ext.mjs).
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); } catch (e) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) return next(`${specifier}.ts`, context);
    throw e;
  }
}
