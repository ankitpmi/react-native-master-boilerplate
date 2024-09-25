#!/usr/bin/env node
import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import { exec } from "child_process"
import util from "util"
import kleur from "kleur"
import  {getProjectName, getBoilerplateType, getPackageId}  from "./src/prompts.js"
import {loading} from './src/helper.js'
import figlet from 'figlet'

const { green } = kleur

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const boilerplates = {
  expo: "ExpoTemplate",
  rncli: "CliTemplate",
}

const execAsync = util.promisify(exec)

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
    figlet.text(
      "M I",
      {
        font: "Doh",
        horizontalLayout: "full",
        verticalLayout: "default",
        width: 90,
        whitespaceBreak: true,
      
      },
      function (err, data) {
        if (err) {
          console.log("Something went wrong...");
          console.dir(err);
          return;
        }
        console.log(data);
      }
    );
    
    if (boilerplate === "expo") {
      let initLoading = loading('Setting up environment...').start()
      await fs.copy(srcPath, destPath)
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
      initLoading.info()
      process.chdir(destPath)

      let installDepenLoading = loading('dependency installing...').start()
      await execAsync("yarn",{stdio: 'inherit'});
      installDepenLoading.succeed('dependency install successfully...')
      await execAsync("git init", { stdio: "inherit" });
      await execAsync("git add .");
      await execAsync(`git commit -m 'Initial commit'`);


      console.log("\n")
      console.log(
        green().bold("Project created successfully.")
      )
    } else {
      if (projectName && packageId) {

        let initLoading = loading('Setting up environment...').start()
        await fs.copy(srcPath, destPath)
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
        initLoading.info()
        process.chdir(destPath) 
        let installDepenLoading = loading('dependency installing...').start()
        await execAsync("yarn", {});
        await execAsync(`npx expo install expo-dev-client`)   
        installDepenLoading.succeed('dependency install successfully...')    
        let preBuildLoading = loading('Prebuild is in process...').start()
        await execAsync(`npx expo prebuild`)
        await execAsync("git init", { stdio: "inherit" });
        await execAsync("git add .");
        await execAsync(`git commit -m 'Initial commit'`);
        preBuildLoading.succeed('Prebuild is in process done!! ...')
  
        console.log("\n")
        console.log(
          green().bold("Project created successfully.")
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