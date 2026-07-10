const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "filament-spools.json");

app.use(cors());
app.use(express.json());

// Serve React build in production
app.use(express.static(path.join(__dirname, "../client/build")));

function readData() {
	return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data) {
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, "\t"), "utf-8");
}

function nextId(data) {
	// Use max existing id + 1, falling back to Date.now() for safety
	const maxId =
		data.length === 0 ? 0 : Math.max(...data.map((s) => Number(s.id) || 0));
	return maxId + 1;
}

// GET all spools
app.get("/api/spools", (req, res) => {
	try {
		res.json(readData());
	} catch (err) {
		res.status(500).json({ error: "Failed to read data" });
	}
});

// POST add a new spool
app.post("/api/spools", (req, res) => {
	try {
		const data = readData();
		const newSpool = { id: nextId(data), ...req.body };
		data.push(newSpool);
		writeData(data);
		res.status(201).json(newSpool);
	} catch (err) {
		res.status(500).json({ error: "Failed to add spool" });
	}
});

// PUT update a spool by id
app.put("/api/spools/:id", (req, res) => {
	try {
		const data = readData();
		const id = parseInt(req.params.id);
		const index = data.findIndex((s) => s.id === id);
		if (index === -1) {
			return res.status(404).json({ error: "Spool not found" });
		}
		// Preserve the id even if the body omits it
		data[index] = { ...req.body, id };
		writeData(data);
		res.json(data[index]);
	} catch (err) {
		res.status(500).json({ error: "Failed to update spool" });
	}
});

// DELETE a spool by id
app.delete("/api/spools/:id", (req, res) => {
	try {
		const data = readData();
		const id = parseInt(req.params.id);
		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid spool id" });
		}
		const index = data.findIndex((s) => s.id === id);
		if (index === -1) {
			return res.status(404).json({ error: "Spool not found" });
		}
		data.splice(index, 1);
		writeData(data);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: "Failed to delete spool" });
	}
});

// Fallback to React app
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
	console.log(`Filament Vault server running on port ${PORT}`);
	console.log(`Data file: ${DATA_FILE}`);
});
