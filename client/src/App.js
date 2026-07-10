import {
	AlertTriangle,
	Calculator,
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	Hash,
	Loader2,
	MapPin,
	Moon,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Sun,
	SwatchBook,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const API = "/api/spools";

// ── Theme ──────────────────────────────────────────────────────
// All values mirror the CSS custom properties in index.css.
// To retheme the app, change index.css — this object just makes
// the same values available to JS-driven inline styles.
const T = {
	// Fonts
	fontBody: "var(--font-body)",
	fontMono: "var(--font-mono)",

	// Accent
	accent: "var(--color-accent)",
	accentHover: "var(--color-accent-hover)",
	accentGlow: "var(--color-accent-glow)",
	accentSubtle: "var(--color-accent-subtle)",

	// Backgrounds
	bg: "var(--color-bg)",
	bgPanel: "var(--color-bg-panel)",
	bgCard: "var(--color-bg-card)",
	bgInput: "var(--color-bg-input)",
	bgHeader: "var(--color-bg-header)",
	bgTag: "var(--color-bg-tag)",
	bgIcon: "var(--color-bg-icon)",

	// Borders
	border: "var(--color-border)",
	borderInput: "var(--color-border-input)",
	borderSubtle: "var(--color-border-subtle)",
	borderSwatch: "var(--color-border-swatch)",
	borderActive: "var(--color-border-active)",

	// Text
	textPrimary: "var(--color-text-primary)",
	textBody: "var(--color-text-body)",
	textMuted: "var(--color-text-muted)",
	textFaint: "var(--color-text-faint)",
	textLink: "var(--color-text-link)",
	textAccent: "var(--color-text-accent)",
	textBrand: "var(--color-text-brand)",
	textActions: "var(--color-text-actions)",

	// Semantic
	successBg: "var(--color-success-bg)",
	successBorder: "var(--color-success-border)",
	danger: "var(--color-danger)",
	dangerBg: "var(--color-danger-bg)",
	dangerHeading: "var(--color-danger-heading)",
	dangerBorder: "var(--color-danger-border)",
	dangerSubtle: "var(--color-danger-subtle)",
	warning: "var(--color-warning)",
};

// Location → CSS variable (defined in index.css)
const TUB_COLORS = {
	"Tub 1": "var(--color-tub1)",
	"Tub 2": "var(--color-tub2)",
	"Tub 3": "var(--color-tub3)",
	Ext: "var(--color-ext)",
};

const EMPTY_SPOOL = {
	type: "PLA",
	name: "",
	colorGroup: "",
	colorCodes: ["#ffffff"],
	finish: "",
	brand: "",
	location: "Tub 1",
	spoolNo: "",
};

/**
 * @typedef {Object} Spool
 * @property {number}   id
 * @property {string}   name
 * @property {string}   type        - One of FILAMENT_TYPES
 * @property {string}   colorGroup  - One of COLOR_GROUPS
 * @property {string[]} colorCodes  - Hex colour values
 * @property {string}   finish      - One of FINISHES
 * @property {string}   brand       - One of BRANDS
 * @property {string}   location    - One of LOCATIONS
 * @property {number|null} spoolNo  - Physical spool number
 */

const FILAMENT_TYPES = ["PLA", "PLA+", "PETG", "TPU", "TPE", "SBS+"];
const FINISHES = ["", "Chameleon", "Marble", "Matte", "Metal", "Silk"];
const BRANDS = [
	"CRON",
	"Creality",
	"eSUN",
	"Filaform",
	"SA Filament",
	"Sunlu",
	"ZEN",
];
const LOCATIONS = ["Tub 1", "Tub 2", "Tub 3", "Ext"];
const COLOR_GROUPS = [
	"Black",
	"Blue",
	"Bronze",
	"Brown",
	"Clear",
	"Gold",
	"Green",
	"Grey",
	"Multi-Color",
	"Orange",
	"Pink",
	"Purple",
	"Red",
	"Silver",
	"White",
	"Yellow",
];

// ── Helpers ────────────────────────────────────────────────────
function useWidth() {
	const [w, setW] = useState(window.innerWidth);
	useEffect(() => {
		const fn = () => setW(window.innerWidth);
		window.addEventListener("resize", fn);
		return () => window.removeEventListener("resize", fn);
	}, []);
	return w;
}

function useDarkMode() {
	const [dark, setDark] = useState(() => {
		const stored = localStorage.getItem("theme");
		return stored ? stored === "dark" : true; // default to dark
	});

	useEffect(() => {
		document.documentElement.setAttribute(
			"data-theme",
			dark ? "dark" : "light",
		);
		localStorage.setItem("theme", dark ? "dark" : "light");
	}, [dark]);

	return [dark, setDark];
}

function getFilamentBg(colorCodes) {
	if (!colorCodes || colorCodes.length === 0) return "#555";
	if (colorCodes.length === 1) return colorCodes[0];
	return `linear-gradient(to right, ${colorCodes.join(", ")})`;
}

// Shared input / label styles (use T so they stay in sync)
const inputStyle = {
	width: "100%",
	padding: "9px 10px",
	borderRadius: 6,
	background: T.bgInput,
	border: `1px solid ${T.borderInput}`,
	color: T.textPrimary,
	fontSize: 14,
	fontFamily: T.fontBody,
	outline: "none",
};

const labelStyle = {
	fontSize: 11,
	color: T.textMuted,
	marginBottom: 4,
	display: "block",
	textTransform: "uppercase",
	letterSpacing: "0.07em",
};

// ── Filter chip ────────────────────────────────────────────────
function FilterChip({ label, active, onClick, isMobile }) {
	return (
		<button
			onClick={onClick}
			style={{
				padding: isMobile ? "7px 16px" : "4px 12px",
				fontSize: isMobile ? 16 : 13,
				borderRadius: 999,
				border: `1px solid ${active ? T.accent : T.borderSubtle}`,
				background: active ? T.accent : "transparent",
				color: active ? "#fff" : T.textBody,
				cursor: "pointer",
				transition: "all .15s",
				whiteSpace: "nowrap",
				fontFamily: T.fontBody,
			}}
		>
			{label}
		</button>
	);
}

// ── Filter section ─────────────────────────────────────────────
function FilterSection({ title, items, activeItems, onToggle, isMobile }) {
	const [open, setOpen] = useState(true);
	return (
		<div style={{ marginBottom: 10 }}>
			<button
				onClick={() => setOpen((o) => !o)}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					width: "100%",
					background: "none",
					border: "none",
					cursor: "pointer",
					color: T.textMuted,
					fontSize: 11,
					letterSpacing: "0.1em",
					textTransform: "uppercase",
					fontWeight: 600,
					fontFamily: T.fontBody,
					marginBottom: open ? 8 : 0,
					padding: "2px 0",
				}}
			>
				{title}
				{open ? (
					<ChevronUp size={isMobile ? 16 : 12} />
				) : (
					<ChevronDown size={isMobile ? 16 : 12} />
				)}
			</button>
			{open && (
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: isMobile ? 8 : 6,
					}}
				>
					{items.map((item) => (
						<FilterChip
							key={item}
							label={item}
							active={activeItems.includes(item)}
							onClick={() => onToggle(item)}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ── Shared filter panel content ────────────────────────────────
function FilterPanelContent({
	opts,
	filters,
	toggleFilter,
	hasActiveFilters,
	resetFilters,
	isMobile = false,
}) {
	return (
		<>
			<FilterSection
				title='Color'
				items={opts.colorGroup}
				activeItems={filters.colorGroup}
				onToggle={(v) => toggleFilter("colorGroup", v)}
				isMobile={isMobile}
			/>
			<FilterSection
				title='Material'
				items={opts.material}
				activeItems={filters.material}
				onToggle={(v) => toggleFilter("material", v)}
				isMobile={isMobile}
			/>
			<FilterSection
				title='Finish'
				items={opts.finish}
				activeItems={filters.finish}
				onToggle={(v) => toggleFilter("finish", v)}
				isMobile={isMobile}
			/>
			<FilterSection
				title='Brand'
				items={opts.brand}
				activeItems={filters.brand}
				onToggle={(v) => toggleFilter("brand", v)}
				isMobile={isMobile}
			/>
			<FilterSection
				title='Location'
				items={opts.location}
				activeItems={filters.location}
				onToggle={(v) => toggleFilter("location", v)}
				isMobile={isMobile}
			/>
		</>
	);
}

// ── Mobile filter drawer ───────────────────────────────────────
function FilterDrawer({
	open,
	onClose,
	opts,
	filters,
	toggleFilter,
	hasActiveFilters,
	resetFilters,
}) {
	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	return (
		<>
			<div
				onClick={onClose}
				style={{
					position: "fixed",
					inset: 0,
					zIndex: 200,
					background: "rgba(0,0,0,0.6)",
					opacity: open ? 1 : 0,
					pointerEvents: open ? "auto" : "none",
					transition: "opacity .25s",
				}}
			/>
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					bottom: 0,
					zIndex: 201,
					width: 280,
					background: T.bgPanel,
					borderRight: `1px solid ${T.border}`,
					display: "flex",
					flexDirection: "column",
					transform: open ? "translateX(0)" : "translateX(-100%)",
					transition: "transform .25s cubic-bezier(.4,0,.2,1)",
				}}
			>
				{/* Sticky header */}
				<div
					style={{
						flexShrink: 0,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "16px 20px 12px",
						borderBottom: `1px solid ${T.border}`,
					}}
				>
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 16,
							fontWeight: 700,
							color: T.textPrimary,
						}}
					>
						Filters
					</span>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<button
							onClick={() => {
								resetFilters();
								onClose();
							}}
							disabled={!hasActiveFilters}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 4,
								background: "none",
								border: "none",
								cursor: hasActiveFilters
									? "pointer"
									: "default",
								color: T.textAccent,
								fontSize: 14,
								fontFamily: T.fontBody,
								visibility: hasActiveFilters
									? "visible"
									: "hidden",
							}}
						>
							<RotateCcw size={14} /> Reset
						</button>
						<button
							onClick={onClose}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								color: T.textMuted,
							}}
						>
							<X size={20} />
						</button>
					</div>
				</div>
				{/* Scrollable filter content */}
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						padding: "16px 20px 10px",
					}}
				>
					<FilterPanelContent
						opts={opts}
						filters={filters}
						toggleFilter={toggleFilter}
						hasActiveFilters={hasActiveFilters}
						isMobile={true}
						resetFilters={() => {
							resetFilters();
							onClose();
						}}
					/>
				</div>
			</div>
		</>
	);
}

// ── Color Picker ───────────────────────────────────────────────
function hexToHsv(hex) {
	const h = (hex || "#000000").replace("#", "").padEnd(6, "0");
	const r = parseInt(h.slice(0, 2), 16) / 255;
	const g = parseInt(h.slice(2, 4), 16) / 255;
	const b = parseInt(h.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	const d = max - min;
	let hue = 0;
	if (d !== 0) {
		if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) hue = ((b - r) / d + 2) / 6;
		else hue = ((r - g) / d + 4) / 6;
	}
	return { h: hue, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex(h, s, v) {
	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);
	let r, g, b;
	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		default:
			r = v;
			g = p;
			b = q;
	}
	return (
		"#" +
		[r, g, b]
			.map((x) =>
				Math.round(x * 255)
					.toString(16)
					.padStart(2, "0"),
			)
			.join("")
	);
}

function ColorPicker({ value, onChange }) {
	const [hsv, setHsv] = useState(() => hexToHsv(value || "#3b82f6"));
	const [hexInput, setHexInput] = useState(value || "#3b82f6");
	const canvasRef = useRef(null);
	const hueRef = useRef(null);
	// "canvas" | "hue" | null — tracks which control is being dragged
	const dragging = useRef(null);
	// Mirror hsv in a ref so document listeners always read fresh values
	const hsvRef = useRef(hsv);
	hsvRef.current = hsv;

	useEffect(() => {
		if (!value) return;
		setHsv(hexToHsv(value));
		setHexInput(value);
	}, [value]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		const { width, height } = canvas;
		const hue = `hsl(${Math.round(hsv.h * 360)}, 100%, 50%)`;
		const gradH = ctx.createLinearGradient(0, 0, width, 0);
		gradH.addColorStop(0, "rgba(255,255,255,1)");
		gradH.addColorStop(1, hue);
		ctx.fillStyle = gradH;
		ctx.fillRect(0, 0, width, height);
		const gradV = ctx.createLinearGradient(0, 0, 0, height);
		gradV.addColorStop(0, "rgba(0,0,0,0)");
		gradV.addColorStop(1, "rgba(0,0,0,1)");
		ctx.fillStyle = gradV;
		ctx.fillRect(0, 0, width, height);
	}, [hsv.h]);

	// Global mouse/touch listeners — track dragging anywhere on the page
	useEffect(() => {
		const onMove = (e) => {
			if (!dragging.current) return;
			const clientX = e.touches ? e.touches[0].clientX : e.clientX;
			const clientY = e.touches ? e.touches[0].clientY : e.clientY;
			const cur = hsvRef.current;
			if (dragging.current === "canvas") {
				const rect = canvasRef.current.getBoundingClientRect();
				const s = Math.max(
					0,
					Math.min(1, (clientX - rect.left) / rect.width),
				);
				const v = Math.max(
					0,
					Math.min(1, 1 - (clientY - rect.top) / rect.height),
				);
				const hex = hsvToHex(cur.h, s, v);
				setHsv({ h: cur.h, s, v });
				setHexInput(hex);
				onChange(hex);
			} else if (dragging.current === "hue") {
				const rect = hueRef.current.getBoundingClientRect();
				const h = Math.max(
					0,
					Math.min(1, (clientX - rect.left) / rect.width),
				);
				const hex = hsvToHex(h, cur.s, cur.v);
				setHsv({ h, s: cur.s, v: cur.v });
				setHexInput(hex);
				onChange(hex);
			}
			if (e.touches) e.preventDefault();
		};
		const onUp = () => {
			dragging.current = null;
		};
		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
		document.addEventListener("touchmove", onMove, { passive: false });
		document.addEventListener("touchend", onUp);
		return () => {
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
			document.removeEventListener("touchmove", onMove);
			document.removeEventListener("touchend", onUp);
		};
	}, [onChange]);

	const handleHexInput = (val) => {
		setHexInput(val);
		if (/^#[0-9a-fA-F]{6}$/.test(val)) {
			const parsed = hexToHsv(val);
			setHsv(parsed);
			onChange(val);
		}
	};

	const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

	return (
		<div style={{ userSelect: "none", touchAction: "none" }}>
			{/* Saturation / brightness canvas */}
			<div
				style={{
					position: "relative",
					marginBottom: 20,
					cursor: "crosshair",
					borderRadius: 6,
					overflow: "hidden",
				}}
				onMouseDown={(e) => {
					dragging.current = "canvas";
					e.preventDefault();
				}}
				onTouchStart={(e) => {
					dragging.current = "canvas";
					e.preventDefault();
				}}
			>
				<canvas
					ref={canvasRef}
					width={400}
					height={160}
					style={{
						display: "block",
						width: "100%",
						height: 150,
						borderRadius: 6,
					}}
				/>
				{/* Crosshair thumb */}
				<div
					style={{
						position: "absolute",
						left: `calc(${hsv.s * 100}% - 9px)`,
						top: `calc(${(1 - hsv.v) * 100}% - 9px)`,
						width: 18,
						height: 18,
						borderRadius: "50%",
						border: "2px solid #fff",
						boxShadow:
							"0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.1)",
						pointerEvents: "none",
						background: currentHex,
					}}
				/>
			</div>

			{/* Hue slider */}
			<div
				ref={hueRef}
				style={{
					position: "relative",
					height: 14,
					borderRadius: 7,
					marginBottom: 14,
					cursor: "pointer",
					background:
						"linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
				}}
				onMouseDown={(e) => {
					dragging.current = "hue";
					e.preventDefault();
				}}
				onTouchStart={(e) => {
					dragging.current = "hue";
					e.preventDefault();
				}}
			>
				{/* Hue thumb */}
				<div
					style={{
						position: "absolute",
						left: `calc(${hsv.h * 100}% - 10px)`,
						top: "50%",
						transform: "translateY(-50%)",
						width: 20,
						height: 20,
						borderRadius: "50%",
						border: "2px solid #fff",
						boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
						pointerEvents: "none",
						background: `hsl(${Math.round(hsv.h * 360)}, 100%, 50%)`,
					}}
				/>
			</div>
		</div>
	);
}

// ── Edit / Add Modal ───────────────────────────────────────────
function SpoolModal({ spool, onSave, onClose, isNew }) {
	const [form, setForm] = useState(() => ({
		...spool,
		colorCodes: [...(spool.colorCodes || ["#3b82f6"])],
		spoolNo: spool.spoolNo ?? "",
	}));
	const [saving, setSaving] = useState(false);
	const [openPickerIndex, setOpenPickerIndex] = useState(null);
	const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
	const swatchRefs = useRef([]);
	const pickerRef = useRef(null);
	const colorSectionRef = useRef(null);

	// Close floating picker when clicking outside swatches AND outside picker
	useEffect(() => {
		if (openPickerIndex === null) return;
		const handler = (e) => {
			const inSwatch = swatchRefs.current.some(
				(el) => el && el.contains(e.target),
			);
			const inPicker =
				pickerRef.current && pickerRef.current.contains(e.target);
			if (inSwatch || inPicker) return;
			setOpenPickerIndex(null);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [openPickerIndex]);
	const width = useWidth();
	const isMobile = width < 600;

	const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
	const setColorCode = (i, val) => {
		const codes = [...form.colorCodes];
		codes[i] = val;
		setForm((f) => ({ ...f, colorCodes: codes }));
	};
	const addColorCode = () =>
		setForm((f) => ({ ...f, colorCodes: [...f.colorCodes, "#ffffff"] }));
	const removeColorCode = (i) => {
		if (form.colorCodes.length <= 1) return;
		setForm((f) => ({
			...f,
			colorCodes: f.colorCodes.filter((_, idx) => idx !== i),
		}));
	};

	const handleSave = async () => {
		if (!form.name.trim() || !form.colorGroup.trim()) return;
		setSaving(true);
		const payload = {
			...form,
			spoolNo: form.spoolNo === "" ? null : Number(form.spoolNo),
		};
		await onSave(payload);
		setSaving(false);
	};

	const canSave = form.name.trim() && form.colorGroup.trim();

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 1000,
				background: "rgba(0,0,0,0.75)",
				display: "flex",
				alignItems: isMobile ? "flex-end" : "center",
				justifyContent: "center",
				padding: isMobile ? 0 : 16,
			}}
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					background: T.bgInput,
					border: `1px solid ${T.borderInput}`,
					borderRadius: isMobile ? "14px 14px 0 0" : 12,
					padding: 20,
					width: "100%",
					maxWidth: isMobile ? "100%" : 480,
					maxHeight: isMobile ? "92vh" : "90vh",
					overflowY: "auto",
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<h2
						style={{
							fontFamily: T.fontBody,
							fontSize: 16,
							color: T.textPrimary,
						}}
					>
						{isNew ? "Add Spool" : "Edit Spool"}
					</h2>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: T.textMuted,
							padding: 4,
						}}
					>
						<X size={18} />
					</button>
				</div>

				{/* Color preview */}
				<div
					style={{
						width: isMobile ? 36 : 40,
						height: isMobile ? 36 : 40,
						borderRadius: 8,
						marginBottom: 16,
						background: getFilamentBg(form.colorCodes),
						border: `2px solid ${T.borderSwatch}`,
					}}
				/>

				{/* Fields */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
						gap: 10,
					}}
				>
					{/* Name */}
					<div>
						<label style={labelStyle}>Name *</label>
						<input
							style={inputStyle}
							value={form.name}
							onChange={(e) => set("name", e.target.value)}
							placeholder='e.g. Cold White'
						/>
					</div>
					{/* Color Group */}
					<div>
						<label style={labelStyle}>Color *</label>
						<select
							style={inputStyle}
							value={form.colorGroup}
							onChange={(e) => set("colorGroup", e.target.value)}
						>
							<option value=''>— select —</option>
							{COLOR_GROUPS.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>
					{/* Type */}
					<div>
						<label style={labelStyle}>Type *</label>
						<select
							style={inputStyle}
							value={form.type}
							onChange={(e) => set("type", e.target.value)}
						>
							{FILAMENT_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>
					{/* Brand */}
					<div>
						<label style={labelStyle}>Brand</label>
						<select
							style={inputStyle}
							value={form.brand}
							onChange={(e) => set("brand", e.target.value)}
						>
							<option value=''>— select —</option>
							{BRANDS.map((b) => (
								<option key={b} value={b}>
									{b}
								</option>
							))}
						</select>
					</div>
					{/* Finish */}
					<div>
						<label style={labelStyle}>Finish</label>
						<select
							style={inputStyle}
							value={form.finish}
							onChange={(e) => set("finish", e.target.value)}
						>
							{FINISHES.map((f) => (
								<option key={f} value={f}>
									{f === "" ? "None" : f}
								</option>
							))}
						</select>
					</div>
					{/* Location */}
					<div>
						<label style={labelStyle}>Location</label>
						<select
							style={inputStyle}
							value={form.location}
							onChange={(e) => set("location", e.target.value)}
						>
							{LOCATIONS.map((loc) => (
								<option key={loc} value={loc}>
									{loc}
								</option>
							))}
						</select>
					</div>
					{/* Spool # */}
					<div>
						<label style={labelStyle}>Spool #</label>
						<input
							style={inputStyle}
							type='number'
							value={form.spoolNo}
							onChange={(e) => set("spoolNo", e.target.value)}
							placeholder='optional'
						/>
					</div>
				</div>

				{/* Color codes */}
				<div ref={colorSectionRef} style={{ marginTop: 16 }}>
					<label style={labelStyle}>Color Codes</label>
					{form.colorCodes.map((code, i) => {
						const isOpen = openPickerIndex === i;
						return (
							<div key={i} style={{ marginBottom: 8 }}>
								{/* Swatch row */}
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 10,
									}}
								>
									{/* Clickable swatch */}
									<div
										ref={(el) =>
											(swatchRefs.current[i] = el)
										}
										onClick={() => {
											if (isOpen) {
												setOpenPickerIndex(null);
											} else {
												// Anchor to color section top — same position for all swatches
												if (colorSectionRef.current) {
													const r =
														colorSectionRef.current.getBoundingClientRect();
													setPickerPos({
														top: r.top,
														left: r.left,
														width: r.width,
													});
												}
												setOpenPickerIndex(i);
											}
										}}
										style={{
											width: 36,
											height: 36,
											borderRadius: 6,
											background: code,
											border: isOpen
												? `2px solid ${T.borderSwatch}`
												: `1px solid ${T.borderInput}`,
											cursor: "pointer",
											flexShrink: 0,
											boxShadow: isOpen
												? `0 0 5px 3px ${T.accentGlow}`
												: "none",
											transition:
												"border .15s, box-shadow .15s",
										}}
										title={
											isOpen
												? "Close picker"
												: "Edit color"
										}
									/>
									{/* Editable hex input */}
									<input
										value={code}
										onChange={(e) => {
											const val = e.target.value;
											setColorCode(i, val);
										}}
										spellCheck={false}
										placeholder='#ffffff'
										style={{
											...inputStyle,
											flex: 1,
											fontFamily: T.fontMono,
											fontSize: 13,
										}}
									/>
									{form.colorCodes.length > 1 && (
										<button
											onClick={() => {
												removeColorCode(i);
												if (isOpen)
													setOpenPickerIndex(null);
											}}
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: T.danger,
												display: "flex",
												alignItems: "center",
												gap: 4,
												fontSize: 11,
												fontFamily: T.fontBody,
												padding: 2,
												flexShrink: 0,
											}}
										>
											<X size={12} /> Remove
										</button>
									)}
								</div>
							</div>
						);
					})}
					{/* Floating picker — fixed position above color section, never moves */}
					{openPickerIndex !== null &&
						(() => {
							const PICKER_W = Math.min(
								300,
								pickerPos.width || 300,
							);
							const PICKER_H = 240;
							const GAP = 0;
							const vw = window.innerWidth;
							// Place above the color section
							let top = pickerPos.top - PICKER_H - GAP;
							if (top < 8) top = pickerPos.top + GAP;
							// Align with left edge of color section, clamped to viewport
							let left = pickerPos.left;
							if (left + PICKER_W > vw - 8)
								left = vw - PICKER_W - 8;
							if (left < 8) left = 8;
							return (
								<div
									ref={pickerRef}
									style={{
										position: "fixed",
										top,
										left,
										width: PICKER_W,
										zIndex: 2000,
										background: T.bgPanel,
										border: `1px solid ${T.borderInput}`,
										borderRadius: 10,
										padding: 14,
										boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
									}}
								>
									<ColorPicker
										value={form.colorCodes[openPickerIndex]}
										onChange={(hex) =>
											setColorCode(openPickerIndex, hex)
										}
									/>
								</div>
							);
						})()}
					<button
						onClick={addColorCode}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							background: "none",
							border: `1px dashed ${T.borderSubtle}`,
							borderRadius: 6,
							padding: "6px 10px",
							color: T.textMuted,
							cursor: "pointer",
							fontSize: 12,
							fontFamily: T.fontBody,
							marginTop: 4,
						}}
					>
						<Plus size={12} /> Add color
					</button>
				</div>

				{/* Actions */}
				<div style={{ display: "flex", gap: 8, marginTop: 20 }}>
					<button
						onClick={onClose}
						style={{
							flex: 1,
							padding: "11px 16px",
							borderRadius: 6,
							border: `1px solid ${T.borderSubtle}`,
							background: "none",
							color: T.textBody,
							cursor: "pointer",
							fontFamily: T.fontBody,
							fontSize: 14,
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={saving || !canSave}
						style={{
							flex: 1,
							padding: "11px 16px",
							borderRadius: 6,
							border: "none",
							background: T.accent,
							color: "#fff",
							cursor: "pointer",
							fontFamily: T.fontBody,
							fontSize: 14,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 6,
							opacity: canSave ? 1 : 0.5,
						}}
					>
						{saving ? (
							<Loader2
								size={14}
								style={{ animation: "spin 1s linear infinite" }}
							/>
						) : (
							<Check size={14} />
						)}
						{isNew ? "Add Spool" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Cost Calculator Modal ──────────────────────────────────────
// ── Empty spool weight reference table ─────────────────────────
const SPOOL_WEIGHTS = [
	{ label: "SA Filament - Plastic (Standard)", weight: 163 },
	{ label: "Bambu Lab - Plastic (Standard)", weight: 212 },
	{ label: "eSUN - Plastic (eSpool+)", weight: 208 },
	{ label: "eSUN - Cardboard (Standard)", weight: 152 },
	{ label: "eSUN - Plastic (Standard)", weight: 285 },
	{ label: "Sunlu - Plastic (Standard)", weight: 128 },
];

function CostCalculator({ onClose }) {
	const [tab, setTab] = useState("cost"); // "cost" | "weight"
	const width = useWidth();
	const isMobile = width < 600;

	const tabBtnStyle = (active) => ({
		flex: 1,
		padding: "9px 0",
		textAlign: "center",
		fontSize: 13,
		fontWeight: 600,
		fontFamily: T.fontBody,
		color: active ? T.textAccent : T.textMuted,
		background: "none",
		border: "none",
		borderBottom: `2px solid ${active ? T.accent : "transparent"}`,
		cursor: "pointer",
		transition: "color .15s, border-color .15s",
	});

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 1000,
				background: "rgba(0,0,0,0.75)",
				display: "flex",
				alignItems: isMobile ? "flex-end" : "center",
				justifyContent: "center",
				padding: isMobile ? 0 : 16,
			}}
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					background: T.bgInput,
					border: `1px solid ${T.borderInput}`,
					borderRadius: isMobile ? "14px 14px 0 0" : 12,
					padding: 24,
					width: "100%",
					maxWidth: isMobile ? "100%" : 400,
					maxHeight: isMobile ? "92vh" : "90vh",
					overflowY: "auto",
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<Calculator size={16} color={T.textAccent} />
						<h2
							style={{
								fontFamily: T.fontMono,
								fontSize: 14,
								color: T.textPrimary,
							}}
						>
							Calculator
						</h2>
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: T.textMuted,
							padding: 4,
						}}
					>
						<X size={18} />
					</button>
				</div>

				{/* Tabs */}
				<div
					style={{
						display: "flex",
						borderBottom: `1px solid ${T.border}`,
						marginBottom: 20,
					}}
				>
					<button
						onClick={() => setTab("cost")}
						style={tabBtnStyle(tab === "cost")}
					>
						Print Cost
					</button>
					<button
						onClick={() => setTab("weight")}
						style={tabBtnStyle(tab === "weight")}
					>
						Spool Weight
					</button>
				</div>

				{tab === "cost" ? <PrintCostTab /> : <SpoolWeightTab />}

				<button
					onClick={onClose}
					style={{
						width: "100%",
						padding: "11px",
						borderRadius: 6,
						border: `1px solid ${T.borderSubtle}`,
						background: "none",
						color: T.textBody,
						cursor: "pointer",
						fontFamily: T.fontBody,
						fontSize: 14,
						marginTop: 20,
					}}
				>
					Close
				</button>
			</div>
		</div>
	);
}

// ── Tab 1: Print Cost Calculator ───────────────────────────────
function PrintCostTab() {
	const [weight, setWeight] = useState("");
	const [hours, setHours] = useState("");

	const filamentCost = weight !== "" ? parseFloat(weight) * 0.35 : null;
	const electricityCost = hours !== "" ? parseFloat(hours) * 4.0 : null;
	const totalCost =
		filamentCost !== null && electricityCost !== null
			? filamentCost + electricityCost
			: null;

	const fmt = (val) =>
		"R " + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

	const labelStyleLocal = {
		fontSize: 11,
		color: T.textMuted,
		marginBottom: 6,
		display: "block",
		textTransform: "uppercase",
		letterSpacing: "0.07em",
	};

	return (
		<>
			{/* Inputs */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 14,
					marginBottom: 24,
				}}
			>
				<div>
					<label style={labelStyleLocal}>Print Time (hours)</label>
					<input
						type='number'
						min='0'
						placeholder='e.g. 3.5'
						value={hours}
						onChange={(e) => setHours(e.target.value)}
						style={{ ...inputStyle, fontSize: 15 }}
					/>
				</div>
				<div>
					<label style={labelStyleLocal}>
						Filament Weight (grams)
					</label>
					<input
						type='number'
						min='0'
						placeholder='e.g. 85'
						value={weight}
						onChange={(e) => setWeight(e.target.value)}
						style={{ ...inputStyle, fontSize: 15 }}
					/>
				</div>
			</div>

			{/* Results */}
			<div
				style={{
					background: T.bgPanel,
					border: `1px solid ${T.border}`,
					borderRadius: 10,
					padding: 16,
					marginBottom: 20,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 10,
					}}
				>
					<span style={{ fontSize: 13, color: T.textBody }}>
						Filament cost
					</span>
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 13,
							color:
								filamentCost !== null
									? T.textPrimary
									: T.textMuted,
						}}
					>
						{filamentCost !== null ? fmt(filamentCost) : "—"}
					</span>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 14,
					}}
				>
					<span style={{ fontSize: 13, color: T.textBody }}>
						Electricity cost
					</span>
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 13,
							color:
								electricityCost !== null
									? T.textPrimary
									: T.textMuted,
						}}
					>
						{electricityCost !== null ? fmt(electricityCost) : "—"}
					</span>
				</div>
				<div
					style={{
						borderTop: `1px solid ${T.border}`,
						paddingTop: 12,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span
						style={{
							fontSize: 15,
							fontWeight: 600,
							color: T.textPrimary,
						}}
					>
						Total
					</span>
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 20,
							fontWeight: 700,
							color:
								totalCost !== null ? T.textAccent : T.textMuted,
						}}
					>
						{totalCost !== null ? fmt(totalCost) : "—"}
					</span>
				</div>
			</div>

			{/* Rate info */}
			<div style={{ display: "flex", gap: 8 }}>
				<div
					style={{
						flex: 1,
						background: T.bgPanel,
						border: `1px solid ${T.border}`,
						borderRadius: 8,
						padding: "8px 12px",
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontSize: 10,
							color: T.textMuted,
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							marginBottom: 2,
						}}
					>
						Filament rate
					</div>
					<div
						style={{
							fontFamily: T.fontMono,
							fontSize: 12,
							color: T.textBody,
						}}
					>
						R 0.35 / g
					</div>
				</div>
				<div
					style={{
						flex: 1,
						background: T.bgPanel,
						border: `1px solid ${T.border}`,
						borderRadius: 8,
						padding: "8px 12px",
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontSize: 10,
							color: T.textMuted,
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							marginBottom: 2,
						}}
					>
						Electricity rate
					</div>
					<div
						style={{
							fontFamily: T.fontMono,
							fontSize: 12,
							color: T.textBody,
						}}
					>
						R 4.00 / hr
					</div>
				</div>
			</div>
		</>
	);
}

// ── Tab 2: Spool Weight Calculator ─────────────────────────────
function SpoolWeightTab() {
	const [spoolTypeIdx, setSpoolTypeIdx] = useState("");
	const [measuredWeight, setMeasuredWeight] = useState("");

	const emptyWeight =
		spoolTypeIdx !== "" ? SPOOL_WEIGHTS[spoolTypeIdx].weight : null;

	const remaining =
		emptyWeight !== null && measuredWeight !== ""
			? parseFloat(measuredWeight) - emptyWeight
			: null;

	const labelStyleLocal = {
		fontSize: 11,
		color: T.textMuted,
		marginBottom: 6,
		display: "block",
		textTransform: "uppercase",
		letterSpacing: "0.07em",
	};

	return (
		<>
			{/* Inputs */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 14,
					marginBottom: 24,
				}}
			>
				<div>
					<label style={labelStyleLocal}>Empty Spool Type</label>
					<select
						value={spoolTypeIdx}
						onChange={(e) => setSpoolTypeIdx(e.target.value)}
						style={{ ...inputStyle, fontSize: 14 }}
					>
						<option value=''>— select —</option>
						{SPOOL_WEIGHTS.map((s, i) => (
							<option key={s.label} value={i}>
								{s.label} ({s.weight}g)
							</option>
						))}
					</select>
				</div>
				<div>
					<label style={labelStyleLocal}>
						Measured Weight (grams)
					</label>
					<input
						type='number'
						min='0'
						placeholder='e.g. 254'
						value={measuredWeight}
						onChange={(e) => setMeasuredWeight(e.target.value)}
						style={{ ...inputStyle, fontSize: 15 }}
					/>
				</div>
			</div>

			{/* Result */}
			<div
				style={{
					background: T.bgPanel,
					border: `1px solid ${T.border}`,
					borderRadius: 10,
					padding: 16,
					marginBottom: 20,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 10,
					}}
				>
					<span style={{ fontSize: 13, color: T.textBody }}>
						Empty spool weight
					</span>
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 13,
							color:
								emptyWeight !== null
									? T.textPrimary
									: T.textMuted,
						}}
					>
						{emptyWeight !== null ? `${emptyWeight} g` : "—"}
					</span>
				</div>
				<div
					style={{
						borderTop: `1px solid ${T.border}`,
						paddingTop: 12,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span
						style={{
							fontSize: 15,
							fontWeight: 600,
							color: T.textPrimary,
						}}
					>
						Estimated filament weight
					</span>
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 20,
							fontWeight: 700,
							color:
								remaining !== null
									? remaining >= 0
										? T.textAccent
										: T.danger
									: T.textMuted,
						}}
					>
						{remaining !== null
							? Math.round(remaining) + " g"
							: "—"}
					</span>
				</div>
				{remaining !== null && remaining < 0 && (
					<div
						style={{ marginTop: 10, fontSize: 12, color: T.danger }}
					>
						Measured weight is less than the empty spool weight —
						double-check your scale or selected spool type.
					</div>
				)}
			</div>

			<div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
				Weigh the spool with the remaining filament on a kitchen scale,
				select the matching empty spool type, and enter the total weight
				above.
			</div>
		</>
	);
}

// ── Delete confirm ─────────────────────────────────────────────
function DeleteConfirm({ spool, onConfirm, onClose }) {
	const width = useWidth();
	const isMobile = width < 600;
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 1000,
				background: "rgba(0,0,0,0.75)",
				display: "flex",
				alignItems: isMobile ? "flex-end" : "center",
				justifyContent: "center",
				padding: isMobile ? 0 : 16,
			}}
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					background: T.bgInput,
					border: `1px solid ${T.borderInput}`,
					borderRadius: isMobile ? "14px 14px 0 0" : 12,
					padding: 24,
					width: "100%",
					maxWidth: isMobile ? "100%" : 380,
					textAlign: "center",
				}}
			>
				<AlertTriangle
					size={32}
					color={T.warning}
					style={{ margin: "0 auto 12px" }}
				/>
				<h2
					style={{
						fontFamily: T.fontBody,
						fontSize: 16,
						color: T.textPrimary,
						marginBottom: 8,
					}}
				>
					Delete Spool?
				</h2>
				<p
					style={{
						color: T.textBody,
						fontSize: 13,
						marginBottom: 20,
					}}
				>
					<strong style={{ color: T.textPrimary }}>
						{spool.name}
					</strong>{" "}
					· <span style={{ color: T.textBrand }}>{spool.brand}</span>{" "}
					· <span style={{ color: T.textAccent }}>{spool.type}</span>
					<br />
					This cannot be undone.
				</p>
				<div style={{ display: "flex", gap: 8 }}>
					<button
						onClick={onClose}
						style={{
							flex: 1,
							padding: "11px 20px",
							borderRadius: 6,
							border: `1px solid ${T.borderSubtle}`,
							background: "none",
							color: T.textBody,
							cursor: "pointer",
							fontFamily: T.fontBody,
							fontSize: 14,
						}}
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						style={{
							flex: 1,
							padding: "11px 20px",
							borderRadius: 6,
							border: "none",
							background: T.danger,
							color: "#fff",
							cursor: "pointer",
							fontFamily: T.fontBody,
							fontSize: 14,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 6,
						}}
					>
						<Trash2 size={13} /> Delete
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Spool card ─────────────────────────────────────────────────
function SpoolCard({ spool, onEdit, onDelete, onCopy, isMobile }) {
	const bg = getFilamentBg(spool.colorCodes);
	const tubColor = TUB_COLORS[spool.location] || T.textBody;

	return (
		<div
			style={{
				background: T.bgCard,
				border: `1px solid ${T.border}`,
				borderRadius: 8,
				display: "flex",
				alignItems: "center",
				padding: isMobile ? "7px 10px" : "10px 14px",
				gap: isMobile ? 14 : 14,
				transition: "border-color .2s, transform .2s",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = T.borderActive;
				e.currentTarget.style.transform = "translateY(-1px)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = T.border;
				e.currentTarget.style.transform = "none";
			}}
		>
			{/* Color swatch */}
			<div
				style={{
					flexShrink: 0,
					width: isMobile ? 48 : 40,
					height: isMobile ? 48 : 40,
					borderRadius: 8,
					background: bg,
					border: `2px solid ${T.borderSwatch}`,
				}}
				title={spool.colorGroup}
			/>

			{/* Main info — stacked layout on mobile */}
			<div style={{ flex: 1, minWidth: 0 }}>
				{isMobile ? (
					/* Mobile: 4 lines */
					<>
						{/* Line 1: Name */}
						<div
							style={{
								fontWeight: 700,
								color: T.textPrimary,
								fontSize: 16,
								marginBottom: 6,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{spool.name}
						</div>
						{/* Line 2: Material + Finish */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								marginBottom: 6,
							}}
						>
							<span
								style={{
									background: T.bgTag,
									border: `1px solid ${T.borderInput}`,
									padding: "2px 8px",
									borderRadius: 4,
									fontFamily: T.fontMono,
									color: T.textAccent,
									fontSize: 13,
								}}
							>
								{spool.type}
							</span>
							{spool.finish && (
								<span
									style={{
										background: T.bgTag,
										border: `1px solid ${T.borderInput}`,
										padding: "2px 8px",
										borderRadius: 4,
										fontSize: 13,
										color: T.textMuted,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									{spool.finish}
								</span>
							)}
						</div>

						{/* Line 3: Brand, Location, ID*/}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								marginBottom: 6,
							}}
						>
							<span
								style={{
									background: T.bgTag,
									border: `1px solid ${T.borderInput}`,
									padding: "2px 8px",
									borderRadius: 4,
									fontFamily: T.fontMono,
									color: T.textBrand,
									fontSize: 13,
								}}
							>
								{spool.brand}
							</span>

							<span
								style={{
									background: T.bgTag,
									border: `1px solid ${T.borderInput}`,
									padding: "2px 8px",
									borderRadius: 4,
									fontFamily: T.fontMono,
									color: tubColor,
									fontSize: 13,
								}}
							>
								{spool.location}
							</span>

							<span
								style={{
									background: T.bgTag,
									border: `1px solid ${T.borderInput}`,
									padding: "2px 8px",
									borderRadius: 4,
									fontFamily: T.fontBody,
									color: T.textBody,
									fontSize: 13,
									display: "flex",
									alignItems: "center",
									gap: 4,
								}}
							>
								<Hash size={11} />
								{spool.spoolNo !== null &&
								spool.spoolNo !== undefined
									? spool.spoolNo
									: "—"}
							</span>
						</div>
					</>
				) : (
					/* Desktop: compact single-block layout */
					<>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								marginBottom: 3,
								flexWrap: "wrap",
							}}
						>
							<span
								style={{
									fontWeight: 600,
									color: T.textPrimary,
									fontSize: 13,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{spool.name}
							</span>
							<span style={{ color: T.borderSubtle }}>·</span>
							<span
								style={{
									fontSize: 12,
									color: T.textBrand,
									fontWeight: 500,
									whiteSpace: "nowrap",
								}}
							>
								{spool.brand}
							</span>
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								flexWrap: "wrap",
							}}
						>
							<span
								style={{
									background: T.bgTag,
									border: `1px solid ${T.borderInput}`,
									padding: "1px 7px",
									borderRadius: 4,
									fontFamily: T.fontMono,
									color: T.textAccent,
									fontSize: 10,
								}}
							>
								{spool.type}
							</span>
							{spool.finish && (
								<span
									style={{
										fontSize: 11,
										color: T.textMuted,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									{spool.finish}
								</span>
							)}
						</div>
					</>
				)}
			</div>
			{/* Location + spool# — desktop only */}
			{!isMobile && (
				<div
					style={{
						flexShrink: 0,
						display: "flex",
						alignItems: "center",
						gap: 14,
						fontSize: 11,
						color: T.textMuted,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						<MapPin size={12} color={tubColor} />
						<span style={{ color: tubColor, fontWeight: 500 }}>
							{spool.location}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						<Hash size={12} />
						<span style={{ fontFamily: T.fontBody, fontSize: 11 }}>
							{spool.spoolNo !== null &&
							spool.spoolNo !== undefined
								? spool.spoolNo
								: "—"}
						</span>
					</div>
				</div>
			)}

			{/* Actions */}
			<div
				style={{
					flexShrink: 0,
					display: "flex",
					flexDirection: isMobile ? "column" : "row",
					gap: 2,
				}}
			>
				<button
					onClick={() => onEdit(spool)}
					title='Edit'
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						color: T.textActions,
						padding: isMobile ? 4 : 6,
						borderRadius: 6,
						transition: "color .15s, background .15s",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = T.textLink;
						e.currentTarget.style.background = T.accentSubtle;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = T.textActions;
						e.currentTarget.style.background = "none";
					}}
				>
					<Pencil size={isMobile ? 20 : 14} />
				</button>
				<button
					onClick={() => onCopy(spool)}
					title='Duplicate'
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						color: T.textActions,
						padding: isMobile ? 4 : 6,
						borderRadius: 6,
						transition: "color .15s, background .15s",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = T.textBrand;
						e.currentTarget.style.background = T.accentSubtle;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = T.textActions;
						e.currentTarget.style.background = "none";
					}}
				>
					<Copy size={isMobile ? 20 : 14} />
				</button>
				<button
					onClick={() => onDelete(spool)}
					title='Delete'
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						color: T.textActions,
						padding: isMobile ? 4 : 6,
						borderRadius: 6,
						transition: "color .15s, background .15s",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = T.dangerHeading;
						e.currentTarget.style.background = T.dangerSubtle;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = T.textActions;
						e.currentTarget.style.background = "none";
					}}
				>
					<Trash2 size={isMobile ? 20 : 14} />
				</button>
			</div>
		</div>
	);
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
	const [spools, setSpools] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({
		location: [],
		material: [],
		brand: [],
		finish: [],
		colorGroup: [],
	});
	const [editModal, setEditModal] = useState(null);
	const [addModal, setAddModal] = useState(false);
	const [copyTemplate, setCopyTemplate] = useState(null); // spool to pre-fill from
	const [deleteModal, setDeleteModal] = useState(null);
	const [calcModal, setCalcModal] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [toast, setToast] = useState(null);
	const toastTimer = useRef(null);
	const width = useWidth();
	const isMobile = width < 768;
	const [dark, setDark] = useDarkMode();

	useEffect(() => {
		fetch(API)
			.then((r) => r.json())
			.then((data) => {
				setSpools(data);
				setLoading(false);
			})
			.catch(() => {
				setError("Could not connect to server");
				setLoading(false);
			});
	}, []);

	const showToast = (msg, ok = true) => {
		clearTimeout(toastTimer.current);
		setToast({ msg, ok });
		toastTimer.current = setTimeout(() => setToast(null), 2500);
	};

	const opts = {
		location: [...new Set(spools.map((s) => s.location))].sort(),
		material: [...new Set(spools.map((s) => s.type))].sort(),
		brand: [...new Set(spools.map((s) => s.brand).filter(Boolean))].sort(),
		finish: [
			...new Set(spools.map((s) => s.finish).filter(Boolean)),
		].sort(),
		colorGroup: [...new Set(spools.map((s) => s.colorGroup))].sort(),
	};

	const toggleFilter = (type, val) => {
		setFilters((f) => {
			const list = f[type];
			return {
				...f,
				[type]: list.includes(val)
					? list.filter((v) => v !== val)
					: [...list, val],
			};
		});
	};

	const resetFilters = () => {
		setSearch("");
		setFilters({
			location: [],
			material: [],
			brand: [],
			finish: [],
			colorGroup: [],
		});
	};

	const hasActiveFilters =
		search || Object.values(filters).some((a) => a.length > 0);
	const activeFilterCount =
		Object.values(filters).reduce((n, a) => n + a.length, 0) +
		(search ? 1 : 0);

	const filtered = spools.filter((s) => {
		const q = search.toLowerCase();
		const matchSearch =
			!q ||
			[
				s.name,
				s.brand,
				s.colorGroup,
				s.type,
				s.finish,
				s.location,
				s.spoolNo != null ? String(s.spoolNo) : null,
			].some((v) => v?.toLowerCase().includes(q));
		const matchLoc =
			!filters.location.length || filters.location.includes(s.location);
		const matchMat =
			!filters.material.length || filters.material.includes(s.type);
		const matchBrnd =
			!filters.brand.length || filters.brand.includes(s.brand);
		const matchFin =
			!filters.finish.length || filters.finish.includes(s.finish);
		const matchColor =
			!filters.colorGroup.length ||
			filters.colorGroup.includes(s.colorGroup);
		return (
			matchSearch &&
			matchLoc &&
			matchMat &&
			matchBrnd &&
			matchFin &&
			matchColor
		);
	});

	const handleSaveEdit = async (payload) => {
		const res = await fetch(`${API}/${editModal.spool.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		if (res.ok) {
			setSpools((prev) =>
				prev.map((s) => (s.id === editModal.spool.id ? payload : s)),
			);
			setEditModal(null);
			showToast("Spool updated");
		} else {
			showToast("Failed to save", false);
		}
	};

	const handleAdd = async (payload) => {
		const res = await fetch(API, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		if (res.ok) {
			const saved = await res.json(); // use server-assigned id
			setSpools((prev) => [...prev, saved]);
			setAddModal(false);
			setCopyTemplate(null);
			showToast("Spool added");
		} else {
			showToast("Failed to add", false);
		}
	};

	const handleDelete = async () => {
		const { spool } = deleteModal;
		if (!spool.id) {
			// No id — spool was never persisted; just remove from local state
			setSpools((prev) => prev.filter((s) => s !== spool));
			setDeleteModal(null);
			showToast("Spool deleted");
			return;
		}
		const res = await fetch(`${API}/${spool.id}`, { method: "DELETE" });
		if (res.ok) {
			setSpools((prev) => prev.filter((s) => s.id !== spool.id));
			setDeleteModal(null);
			showToast("Spool deleted");
		} else {
			showToast("Failed to delete", false);
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* ── Header ── */}
			<header
				style={{
					position: "sticky",
					top: 0,
					zIndex: 100,
					background: T.bgHeader,
					backdropFilter: "blur(12px)",
					borderBottom: `1px solid ${T.border}`,
				}}
			>
				<div
					style={{
						maxWidth: 1200,
						margin: "0 auto",
						padding: isMobile ? "10px 14px" : "12px 20px",
					}}
				>
					{isMobile ? (
						/* ── Mobile: 2-row layout ── */
						<>
							{/* Row 1: Logo + theme toggle */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginBottom: 8,
								}}
							>
								{/* Logo */}
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									<div
										style={{
											background: T.bgIcon,
											borderRadius: 8,
											padding: 6,
											display: "flex",
										}}
									>
										<SwatchBook
											size={18}
											color={T.textLink}
										/>
									</div>
									<div
										style={{
											fontFamily: T.fontMono,
											fontSize: 16,
											fontWeight: 700,
											color: T.textPrimary,
											lineHeight: 1,
										}}
									>
										Filament Vault
									</div>
								</div>
								{/* Calculator + Theme toggle grouped */}
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									<button
										onClick={() => setCalcModal(true)}
										title='Print Cost Calculator'
										style={{
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											background: T.bgCard,
											border: `1px solid ${T.borderInput}`,
											borderRadius: 8,
											padding: "7px 9px",
											color: T.textMuted,
											cursor: "pointer",
										}}
									>
										<Calculator size={15} />
									</button>
									<button
										onClick={() => setDark((d) => !d)}
										title={
											dark
												? "Switch to light mode"
												: "Switch to dark mode"
										}
										style={{
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											background: T.bgCard,
											border: `1px solid ${T.borderInput}`,
											borderRadius: 8,
											padding: "7px 9px",
											color: T.textMuted,
											cursor: "pointer",
										}}
									>
										{dark ? (
											<Sun size={15} />
										) : (
											<Moon size={15} />
										)}
									</button>
								</div>
							</div>
							{/* Row 2: Search + filter + add */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
								}}
							>
								{/* Search */}
								<div style={{ flex: 1, position: "relative" }}>
									<Search
										size={14}
										style={{
											position: "absolute",
											left: 10,
											top: "50%",
											transform: "translateY(-50%)",
											color: T.textAccent,
											pointerEvents: "none",
										}}
									/>
									<input
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
										placeholder='Search filaments…'
										style={{
											...inputStyle,
											paddingLeft: 32,
											paddingTop: 9,
											paddingBottom: 9,
											background: T.bgCard,
											width: "100%",
										}}
									/>
								</div>

								{/* Filter button */}
								<button
									onClick={() => setDrawerOpen(true)}
									style={{
										flexShrink: 0,
										position: "relative",
										background:
											activeFilterCount > 0
												? T.accent
												: T.bgCard,
										border: `1px solid ${activeFilterCount > 0 ? T.accent : T.borderInput}`,
										borderRadius: 8,
										padding: "9px 11px",
										color:
											activeFilterCount > 0
												? "#fff"
												: T.textMuted,
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
									}}
								>
									<SlidersHorizontal size={15} />
									{activeFilterCount > 0 && (
										<span
											style={{
												position: "absolute",
												top: -6,
												right: -6,
												background: T.danger,
												color: "#fff",
												borderRadius: 999,
												fontSize: 9,
												fontWeight: 700,
												minWidth: 16,
												height: 16,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												padding: "0 3px",
											}}
										>
											{activeFilterCount}
										</span>
									)}
								</button>
							</div>
							{/* Row 3: count + clear */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginTop: 8,
								}}
							>
								<span
									style={{
										fontSize: 14,
										color: T.textFaint,
										fontFamily: T.fontMono,
									}}
								>
									{loading
										? "…"
										: `${filtered.length} / ${spools.length}`}{" "}
									spools
									{hasActiveFilters && (
										<span style={{ color: T.textLink }}>
											{" "}
											(filtered)
										</span>
									)}
								</span>
								{hasActiveFilters && (
									<button
										onClick={resetFilters}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 4,
											background: "none",
											border: "none",
											cursor: "pointer",
											color: T.textAccent,
											fontSize: 14,
											fontFamily: T.fontBody,
										}}
									>
										<RotateCcw size={13} /> Clear filters
									</button>
								)}
							</div>
						</>
					) : (
						/* ── Desktop: single row ── */
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 10,
							}}
						>
							{/* Logo */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									flexShrink: 0,
								}}
							>
								<div
									style={{
										background: T.bgIcon,
										borderRadius: 8,
										padding: 7,
										display: "flex",
									}}
								>
									<SwatchBook size={22} color={T.textLink} />
								</div>
								<div>
									<div
										style={{
											fontFamily: T.fontMono,
											fontSize: 13,
											fontWeight: 700,
											color: T.textPrimary,
											lineHeight: 1,
										}}
									>
										Filament Vault
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											marginTop: 2,
										}}
									>
										<span
											style={{
												fontSize: 10,
												color: "var(--color-text-faint)",
											}}
										>
											Spool Inventory
										</span>
										<span
											style={{
												fontSize: 9,
												color: "var(--color-text-body)",
												fontFamily: "var(--font-mono)",
												opacity: 0.8,
											}}
										>
											v1.2.0
										</span>
									</div>
								</div>
							</div>
							{/* Search */}
							<div style={{ flex: 1, position: "relative" }}>
								<Search
									size={14}
									style={{
										position: "absolute",
										left: 10,
										top: "50%",
										transform: "translateY(-50%)",
										color: T.textAccent,
										pointerEvents: "none",
									}}
								/>
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder='Search filaments…'
									style={{
										...inputStyle,
										paddingLeft: 32,
										paddingTop: 7,
										paddingBottom: 7,
										background: T.bgCard,
									}}
								/>
							</div>
							{/* Desktop: count + theme + add */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									flexShrink: 0,
								}}
							>
								<div
									style={{
										background: T.bgInput,
										border: `1px solid ${T.borderInput}`,
										borderRadius: 8,
										padding: "5px 14px",
										fontSize: 12,
										color: T.textAccent,
										fontFamily: T.fontMono,
										whiteSpace: "nowrap",
									}}
								>
									{loading
										? "…"
										: `${filtered.length} / ${spools.length}`}{" "}
									spools
								</div>
								<button
									onClick={() => setAddModal(true)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 6,
										background: T.accent,
										border: "none",
										borderRadius: 8,
										padding: "7px 14px",
										color: "#fff",
										cursor: "pointer",
										fontFamily: T.fontBody,
										fontSize: 13,
										fontWeight: 500,
										whiteSpace: "nowrap",
									}}
								>
									<Plus size={14} /> Add
								</button>
								<button
									onClick={() => setCalcModal(true)}
									title='Print Cost Calculator'
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: T.bgInput,
										border: `1px solid ${T.borderInput}`,
										borderRadius: 8,
										padding: "7px 9px",
										color: T.textMuted,
										cursor: "pointer",
									}}
								>
									<Calculator size={15} />
								</button>
								<button
									onClick={() => setDark((d) => !d)}
									title={
										dark
											? "Switch to light mode"
											: "Switch to dark mode"
									}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: T.bgInput,
										border: `1px solid ${T.borderInput}`,
										borderRadius: 8,
										padding: "7px 9px",
										color: T.textMuted,
										cursor: "pointer",
										transition: "color .15s",
									}}
								>
									{dark ? (
										<Sun size={15} />
									) : (
										<Moon size={15} />
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</header>

			{/* ── Body ── */}
			<div
				style={{
					flex: 1,
					maxWidth: 1200,
					margin: "0 auto",
					width: "100%",
					padding: isMobile ? "12px 12px 90px" : "20px",
					display: "flex",
					gap: 20,
				}}
			>
				{/* Desktop sidebar */}
				{!isMobile && (
					<aside
						style={{
							width: 210,
							flexShrink: 0,
							background: T.bgPanel,
							border: `1px solid ${T.border}`,
							borderRadius: 10,
							padding: 16,
							alignSelf: "flex-start",
							position: "sticky",
							top: 74,
						}}
					>
						<FilterPanelContent
							opts={opts}
							filters={filters}
							toggleFilter={toggleFilter}
							hasActiveFilters={hasActiveFilters}
							resetFilters={resetFilters}
						/>
					</aside>
				)}

				{/* Main content */}
				<main style={{ flex: 1, minWidth: 0 }}>
					{loading && (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: 200,
								color: T.textMuted,
								gap: 8,
							}}
						>
							<Loader2
								size={18}
								style={{ animation: "spin 1s linear infinite" }}
							/>{" "}
							Loading…
						</div>
					)}
					{error && (
						<div
							style={{
								background: T.dangerSubtle,
								border: `1px solid ${T.dangerBorder}`,
								borderRadius: 8,
								padding: 16,
								color: T.dangerHeading,
								fontSize: 13,
							}}
						>
							<strong>Connection error:</strong> {error}
							<br />
							<span style={{ fontSize: 12, color: T.danger }}>
								Make sure the server is running on port 3001.
							</span>
						</div>
					)}
					{!loading && !error && (
						<>
							{!isMobile && (
								<div
									style={{
										fontSize: 12,
										color: T.textFaint,
										marginBottom: 12,
									}}
								>
									Showing {filtered.length} spool
									{filtered.length !== 1 ? "s" : ""}
									{hasActiveFilters && (
										<span style={{ color: T.textLink }}>
											{" "}
											(filtered)
										</span>
									)}
								</div>
							)}
							{filtered.length === 0 ? (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
										height: 180,
										color: T.textFaint,
										gap: 8,
									}}
								>
									<SwatchBook size={32} opacity={0.3} />
									<div style={{ fontSize: 13 }}>
										No spools match your filters
									</div>
									<button
										onClick={resetFilters}
										style={{
											background: "none",
											border: `1px solid ${T.borderSubtle}`,
											borderRadius: 6,
											padding: "6px 14px",
											color: T.textMuted,
											cursor: "pointer",
											fontSize: 13,
											fontFamily: T.fontBody,
										}}
									>
										Clear filters
									</button>
								</div>
							) : (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: isMobile ? 8 : 6,
									}}
								>
									{filtered.map((spool) => (
										<SpoolCard
											key={spool.id}
											spool={spool}
											isMobile={isMobile}
											onCopy={(s) => {
												const {
													id: _id,
													...spoolCopy
												} = s;
												setCopyTemplate(spoolCopy);
												setAddModal(true);
											}}
											onEdit={(s) =>
												setEditModal({ spool: s })
											}
											onDelete={(s) =>
												setDeleteModal({ spool: s })
											}
										/>
									))}
								</div>
							)}
						</>
					)}
				</main>
			</div>

			{/* ── Mobile FAB ── */}
			{isMobile && (
				<button
					onClick={() => setAddModal(true)}
					style={{
						position: "fixed",
						bottom: 20,
						right: 20,
						zIndex: 150,
						width: 54,
						height: 54,
						borderRadius: 999,
						background: T.accent,
						border: "none",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						color: "#fff",
						boxShadow: `0 4px 24px ${T.accentGlow}`,
					}}
				>
					<Plus size={22} />
				</button>
			)}

			{/* ── Mobile filter drawer ── */}
			<FilterDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				opts={opts}
				filters={filters}
				toggleFilter={toggleFilter}
				hasActiveFilters={hasActiveFilters}
				resetFilters={resetFilters}
			/>

			{/* ── Modals ── */}
			{editModal && (
				<SpoolModal
					spool={editModal.spool}
					onSave={handleSaveEdit}
					onClose={() => setEditModal(null)}
					isNew={false}
				/>
			)}
			{(addModal || copyTemplate) && (
				<SpoolModal
					spool={copyTemplate || EMPTY_SPOOL}
					onSave={handleAdd}
					onClose={() => {
						setAddModal(false);
						setCopyTemplate(null);
					}}
					isNew={true}
				/>
			)}
			{deleteModal && (
				<DeleteConfirm
					spool={deleteModal.spool}
					onConfirm={handleDelete}
					onClose={() => setDeleteModal(null)}
				/>
			)}

			{/* ── Cost Calculator ── */}
			{calcModal && (
				<CostCalculator onClose={() => setCalcModal(false)} />
			)}

			{/* ── Toast ── */}
			{toast && (
				<div
					style={{
						position: "fixed",
						bottom: isMobile ? 84 : 24,
						right: 16,
						zIndex: 2000,
						background: toast.ok ? T.successBg : T.dangerBg,
						border: `1px solid ${toast.ok ? T.successBorder : T.dangerBorder}`,
						borderRadius: 8,
						padding: "10px 16px",
						color: "#fff",
						fontSize: 13,
						fontFamily: T.fontBody,
						boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
						animation: "fadein .2s ease",
					}}
				>
					{toast.msg}
				</div>
			)}

			<style>{`
				@keyframes spin { to { transform: rotate(360deg); } }
				@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
				* { -webkit-tap-highlight-color: transparent; }
				input, select, button { touch-action: manipulation; }
			`}</style>
		</div>
	);
}
