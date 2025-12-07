import fs from "fs";
import path from "path";

const lockPath = path.join(process.cwd(), ".next", "lock");

fs.mkdirSync(path.dirname(lockPath), { recursive: true });

if (!fs.existsSync(lockPath)) {
  fs.writeFileSync(lockPath, "");
  console.log(`Created missing lock file at ${lockPath}`);
} else {
  console.log(`Lock file already present at ${lockPath}`);
}
