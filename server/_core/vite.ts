import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
    watch: {
      ignored: ["**/.env", "**/.env.*", "**/node_modules/**", "**/.git/**"],
      usePolling: false,
    },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // CORREÇÃO FINAL: O caminho deve ser absoluto a partir do diretório de execução.
  // O log de deploy confirma que o build está em /opt/render/project/src/dist/public.
  // process.cwd() é /opt/render/project/src.
  const distPath = path.resolve(process.cwd(), "dist", "public");
  console.log(`[Static] Servindo arquivos do diretório: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(
      `[Static] ERRO: Diretório de build não encontrado: ${distPath}. Certifique-se de executar 'pnpm run build' primeiro.`
    );
    return; 
  }

  // 1. Serve arquivos estáticos (JS, CSS, Imagens, etc.).
  app.use(express.static(distPath));

  // 2. Fallback para rotas SPA: qualquer rota que não for um arquivo estático
  // cai aqui e recebe o index.html, corrigindo o problema do Uncaught SyntaxError.
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    // Envia o index.html gerado pelo Vite.
    res.sendFile(indexPath);
  });
}