import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		allowedHosts: ["localhost", "56ce-154-192-45-67.ngrok-free.app", "b911-154-192-45-67.ngrok-free.app/"],
	},
});
