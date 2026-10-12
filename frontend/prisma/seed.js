import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const projects = [
  {
    id: "01",
    name: "VICA",
    channel: "CHANNEL 01",
    category: "AI AUDIO",
    type: "LOCAL VOICE STUDIO",
    status: "ONLINE",
    subtitle: "LOCAL VOICE SYNTHESIS STUDIO",
    overview:
      "VICA is a local voice studio for Indonesian text-to-speech and voice cloning, built to explore AI-powered voice generation on a personal computer.",
    features: [
      "Voice cloning",
      "Text-to-speech",
      "Voice library",
      "Audio generation",
      "Playback controls",
    ],
    tech: ["React", "FastAPI", "F5-TTS", "FFmpeg"],
    video: {
      videoId: "N1y9ilJzp7s",
      title: "VICA — Local Voice Studio",
    },
  },
  {
    id: "02",
    name: "PEEKPANEL",
    channel: "CHANNEL 02",
    category: "UTILITY",
    type: "UTILITY SYSTEM",
    status: "ONLINE",
    subtitle: "INTERACTIVE OVERLAY UTILITY",
    overview:
      "PeekPanel is a utility system for organizing game walkthroughs and live coding overlays, with a Go backend and PostgreSQL database.",
    features: [
      "Product catalog",
      "Order request",
      "Inventory management",
      "Admin order status",
      "MOQ validation",
    ],
    tech: ["Go", "React", "GORM", "PostgreSQL", "Neon"],
    video: {
      videoId: "2ynnUYg5On0",
      title: "PeekPanel — Project Demo",
    },
  },
  {
    id: "03",
    name: "KIVA",
    channel: "CHANNEL 03",
    category: "AI VISUAL",
    type: "VISUAL EXPERIMENT",
    status: "ON HOLD",
    subtitle: "LOCAL AI IMAGE EXPERIMENT",
    overview:
      "KIVA is a local AI image generation project built to explore diffusion models, prompt experimentation, and image generation workflows.",
    features: [
      "Local image generation",
      "Prompt experimentation",
      "Diffusion model testing",
      "Image workflow exploration",
    ],
    tech: ["Python", "Diffusers", "Stable Diffusion", "Hugging Face"],
    video: {
      videoId: "JE8hZ3BznXU",
      title: "KIVA — AI Image Experiment",
    },
  },
];

async function main() {
  for (const project of projects) {
    const { video, ...projectData } = project;

    await prisma.project.upsert({
      where: { id: projectData.id },
      update: projectData,
      create: projectData,
    });

    await prisma.projectVideo.upsert({
      where: {
        projectId_videoId: {
          projectId: projectData.id,
          videoId: video.videoId,
        },
      },
      update: {
        title: video.title,
        isFeatured: true,
        sortOrder: 0,
      },
      create: {
        projectId: projectData.id,
        videoId: video.videoId,
        title: video.title,
        isFeatured: true,
        sortOrder: 0,
      },
    });

    console.log(`Seeded: ${projectData.name}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
