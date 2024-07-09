#!/usr/bin/env node
const inquirer = require('inquirer');
const { execSync } = require("child_process");
const fs = require('fs-extra');
const path = require('path');

const templates = {
  expo: path.resolve(__dirname, 'templates', 'ExpoTemplate'),
  rncli: path.resolve(__dirname, 'templates', 'CliTemplate')
};

async function createProject() {
  const { projectType, projectName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectType',
      message: 'Choose the type of project to create:',
      choices: ['Expo', 'React Native CLI'],
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter the project name:',
    },
  ]);

  const templatePath = projectType === 'Expo' ? templates.expo : templates.rncli;
  const targetPath = path.resolve(process.cwd(), projectName);

  try {
    console.log('Copying project files...');
    await fs.copy(templatePath, targetPath);

    console.log('yarn dependencies...');
    // await execa('yarn', ['yarn'], { cwd: targetPath });
    execSync(`cd ${process.cwd()}/${projectName} && yarn`, { stdio: "pipe" });

    console.log(`Project ${projectName} created successfully!`);
  } catch (error) {
    console.error('Error creating project:', error);
  }
}

createProject();
