import React from "react";
import { createRoot } from "react-dom/client";
import { Landing } from "@/landing/Landing";
import "@/landing/landing.css";

createRoot(document.getElementById("root")!).render(<Landing />);
