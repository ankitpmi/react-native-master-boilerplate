
import kleur from "kleur"

const { red, green, yellow } = kleur

export const logError = (message) => {  
  console.error(red().bold(`[ERROR] ${message}`))
  process.exit(1); // Exit the process after logging error
}
export const logWarning = (message) => {  
  console.warn(yellow().bold(`[WARNING] ${message}`))
}
export const logSuccess = (message) => {  
  console.log(green().bold(`[SUCCESS] ${message}`))  
}