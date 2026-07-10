# Filament Vault 🧵

3D Printer Filament Inventory Manager — React + Express

---

## Project Structure

```
filament-vault/
├── server/
│   ├── server.js              ← Express API (read/write JSON)
│   ├── package.json
│   └── filament-spools.json  ← Your data file (edit this directly or via the app)
├── client/
│   ├── src/
│   │   ├── App.js             ← React app
│   │   └── index.js
│   └── package.json
└── package.json               ← Root convenience scripts
```

Npm commands to install dependencies and run:

```bash
# 1. Install dependencies for both server and client
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Start the Server
node server.js

# 3. Build the React app
cd client && npm run build && cd ..

# 4. Start the Client app
cd client && npm start && cd ..
```

---

## Setup (one time)

### Step 1 — Enable SSH on the NAS

In DSM go to Control Panel → Terminal & SNMP → Terminal tab, tick Enable SSH service, click Apply. Port 22 is default (Use whatever SSH port is configured on the NAS).

Then from your Windows PC open a terminal and connect:

```bash
ssh -p 22 your-username@your-nas-ip
```

Use your normal DSM login credentials.

### Step 2 — Install Node.js and Web Station on the NAS

In DSM open Package Center, search for 'Node.js', install it.

Then search for 'Web Station', install it.

That's all — no config needed.

### Step 3 — Build the React app on your PC first

Before copying anything to the NAS, build the client on your Windows machine:

```bash
cd filament-vault/client
npm run build
```

This creates a **_client/build_** folder. The server will serve these static files.

### Step 4 — Copy the project to the NAS

You only need to copy two things — the **_server folder_** and the **_built client_**. You don't need client/src or node_modules on the NAS.

The easiest way on Windows is via File Explorer. Map your NAS as a network drive or just use **_\\\\your-nas-ip\\_** and navigate to a shared folder. A good place is:

```
/volume1/web/filament-vault/
```

Copy this structure across:

```
filament-vault/
├── server/
│   ├── server.js
│   ├── package.json
│   └── filament-spools.json
└── client/
    └── build/          ← the built React output
```

### Step 5 — Install server dependencies on the NAS

Back in your SSH terminal:

```bash
cd /volume1/web/filament-vault/server
npm install --production
```

### Step 6 — Run the server with PM2 (auto-restart on reboot)

PM2 is a process manager that keeps Node apps alive. Install it once globally

```bash
npm install -g pm2
```

**Note:** If you do not have privileges to install PM2 globally, you will need to run the command with elevated privileges:

```bash
sudo -i
```

Enter your password again. Then re-run the command:

```bash
npm install -g pm2
```

Start your app:

```bash
cd /volume1/web/filament-vault/server
pm2 start server.js --name filament-vault
pm2 save
```

To make PM2 survive reboots, run:

```bash
pm2 startup
```

It will print a command — copy and run that command exactly as shown.

Your app is now running on port 3001 internally.

[http://your-nas-ip:3001](http://your-nas-ip:3001)

To change the port, set the environment variable:

```bash
PORT=8080 node server.js
```

### Step 7 — Set up Nginx reverse proxy in Web Station

This is what makes the app accessible via your normal domain/IP without **:3001** in the URL. In DSM:

Go to **_Control Panel_** → **_Login Portal_** → **_Advanced tab_** → **_Reverse Proxy_**

Click Create and fill it in like this:

Source:

- Reverse Proxy Name: Filament Vault
- Protocol: HTTP
- Hostname: filament.local
- Port: 80

Destination:

- Protocol: HTTP
- Hostname: localhost
- Port: 3001

Click Save.

Then make sure your PC resolves **_filament.local_** to your NAS IP. Since this isn't a real domain, your PC doesn't know where it is. The easiest fix is to edit your hosts file on Windows:

1. Open Notepad as Administrator
2. Open the file C:\Windows\System32\drivers\etc\hosts
3. Add a line at the bottom:

    >

    ```bash
    192.168.x.x    filament.local
    ```

    (replace with your actual NAS IP)

4. Save the file

Then try [http://filament.local](http://filament.local) in your browser — it should hit the app through Nginx.

## Updating your data

The JSON file is at `server/filament-spools.json`. You can:

- Edit it directly in any text editor
- Use the app's Add / Edit / Delete buttons (changes save back to the file instantly)

---

## Rebuilding after code changes

If you modify the React app source:

```bash
# 1. Client
# 1a. Build the Client React app (on dev machine)
cd client && npm run build
# 1b. Copy 'client/build' folder to the NAS (Overwrite)

# 2. Server
# 2a. If you changed 'server.js, copy that file to the NAS - '/server/server.js'  (Overwrite)
# 2b. run the following in SSH (restarts the server.)
pm2 restart filament-vault

```
