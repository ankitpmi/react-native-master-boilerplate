#!/usr/bin/env node
import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import { exec } from "child_process"
import util from "util"
import kleur from "kleur"
import  {getProjectName, getBoilerplateType, getPackageId}  from "./src/prompts.js"
import {logSuccess} from './src/helper.js'

const { green } = kleur

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const boilerplates = {
  expo: "ExpoTemplate",
  rncli: "CliTemplate",
}

const execAsync = util.promisify(exec)

function loadingAnimation(
  getText,
  chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"],
  delay = 100
) {
  let x = 0

  return setInterval(function () {
    process.stdout.write("\r" + chars[x++] + " " + getText())
    x = x % chars.length
  }, delay)
}

async function main() {
  const { projectName } = await getProjectName()
  if (!projectName) {
    return
  }
  const destPath = path.resolve(process.cwd(), projectName)

  const packageJsonPath = path.join(destPath, "package.json")
  const appJsonPath = path.join(destPath, "app.json")

  const { boilerplate } = await getBoilerplateType()

  let packageId = null
  if (boilerplate === "bare react native") {
    const response = await getPackageId(projectName)
    packageId = response.packageId
  }

  const selectedType =
    boilerplate === "bare react native" ? "expo" : boilerplate

  const srcPath = path.resolve(
    __dirname,
    "templates",
    boilerplates[selectedType]
  )

  try {
    let loader
    if (boilerplate === "expo") {
      await fs.copy(srcPath, destPath)
      loader = loadingAnimation(() => `Setting up environment...`)
      clearInterval(loader)
      loader = loadingAnimation(
        () => `Initializing new React Native project...`
      )
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath)
        packageJson.name = projectName
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
      }

      if (await fs.pathExists(appJsonPath)) {
        const appJson = await fs.readJson(appJsonPath)
        appJson.expo.name = projectName
        appJson.expo.slug = projectName
        await fs.writeJson(appJsonPath, appJson, { spaces: 2 })       
      }

      process.chdir(destPath)

      logSuccess('dependency installing...')
      await execAsync("yarn",{stdio: 'inherit'});
      logSuccess('dependency install successfully...')
      await execAsync("git init", { stdio: "inherit" });
      await execAsync("git add .");
      await execAsync(`git commit -m 'Initial commit'`);


      clearInterval(loader)
      console.log("\n")
      console.log(
        green().bold("React Native EXPO project created successfully.")
      )
    } else {
      if (projectName && packageId) {

        await fs.copy(srcPath, destPath)
        loader = loadingAnimation(() => `Setting up environment...`)
        clearInterval(loader)
        loader = loadingAnimation(
          () => `Initializing new React Native project...`
        )
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJson(packageJsonPath)
          packageJson.name = projectName
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
        }
  
        if (await fs.pathExists(appJsonPath)) {
          const appJson = await fs.readJson(appJsonPath)
          appJson.expo.name = projectName
          appJson.expo.slug = projectName
          appJson.expo.ios.bundleIdentifier = packageId
          appJson.expo.android.package = packageId
          await fs.writeJson(appJsonPath, appJson, { spaces: 2 })       
        }
        clearInterval(loader)
        process.chdir(destPath) 
        console.log('process.cwd() ::: ', process.cwd());
        
        logSuccess('dependency installing...') 
        await execAsync("yarn", {});
        logSuccess('dependency install successfully...')
        await execAsync(`npx expo install expo-dev-client`)            
        await execAsync(`npx expo prebuild`)
        await execAsync("git init", { stdio: "inherit" });
        await execAsync("git add .");
        await execAsync(`git commit -m 'Initial commit'`);
  
  
        clearInterval(loader)
        console.log("\n")
        console.log(
          green().bold("React Native EXPO project created successfully.")
        )        
      } else {
        return
      }
    }
  } catch (err) {
    console.error("Error setting up boilerplate:", err)
  }
}

main()