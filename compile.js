const fs = require("fs");
const shell = require("shelljs");

if (!shell.which("git")) {
  shell.echo("Sorry, this script requires git");
  shell.exit(1);
}

const smcNames = [
  "Demiurge",
  "DemiurgeStore",
  "Padawan",
  "Proposal",
  "TestRoot",
];

const compileScripts = [];

smcNames.forEach((name) => {
  compileScripts.push(`npx tondev sol compile ./src/${name}.sol`);
  compileScripts.push(`mv ./src/${name}.abi.json ./build/${name}.abi.json`);
  compileScripts.push(`mv ./src/${name}.tvc ./build/${name}.tvc`);
});

compileScripts.forEach((script) => {
  shell.exec(script);
});

smcNames.forEach((name) => {
  const abiRaw = fs.readFileSync(`./build/${name}.abi.json`);
  const abi = JSON.parse(abiRaw);
  const image = fs.readFileSync(`./build/${name}.tvc`, { encoding: "base64" });

  fs.writeFileSync(
    `./ton-packages/${name}.package.ts`,
    `export default ${JSON.stringify({ abi, image })}`
  );
});

shell.exit(0);
