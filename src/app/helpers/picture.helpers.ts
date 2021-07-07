/**
 * Converts a raw binary picture data to a base64n data url usable on UI.
 * Ex: âPNG   IHDR... ---> "data:image/png;base64,iVe89...."
 */
export function rawImageToBase64DataUrl(rawImageData: Buffer): string {
  // TODO: COULD BE JPG OR SOMETHING ELSE, NOT ALWAYS PNG!
  return "data:image/png;base64,"+Buffer.from(rawImageData).toString("base64");
}