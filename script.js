
const $ = (id) => document.getElementById(id);

// ===================================
// OPEN INVITATION + BACKGROUND MUSIC
// ===================================

const opening = $("opening");
const music = $("weddingMusic");
const musicButton = $("musicButton");
const musicLabel = $("musicLabel");

music.volume = 0.45;

function updateMusicButton() {
  const playing = !music.paused;
  musicLabel.textContent = playing ? "PAUSE" : "MUSIC";
  musicButton.setAttribute(
    "aria-label",
    playing ? "Pause music" : "Play music"
  );
}

async function playMusic() {
  try {
    await music.play();
  } catch (error) {
    console.warn("Music could not play:", error);
  }
  updateMusicButton();
}

$("openInvitation").addEventListener("click", () => {
  opening.classList.add("closed");
  playMusic();

  setTimeout(() => {
    opening.hidden = true;
  }, 1100);
});

musicButton.addEventListener("click", async () => {
  if (music.paused) {
    await playMusic();
  } else {
    music.pause();
    updateMusicButton();
  }
});

music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);

// ===================================
// COUNTDOWN
// ===================================

const weddingDate = new Date("2026-10-28T18:00:00+03:00");

function updateCountdown() {
  const remaining = Math.max(
    0,
    weddingDate.getTime() - Date.now()
  );

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining / 3600000) % 24);
  const minutes = Math.floor((remaining / 60000) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  $("days").textContent = String(days).padStart(2, "0");
  $("hours").textContent = String(hours).padStart(2, "0");
  $("minutes").textContent = String(minutes).padStart(2, "0");
  $("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ===================================
// SAVE THE DATE
// ===================================

$("saveDate").addEventListener("click", () => {
  const calendarEvent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Duha Moatasem//Invitation//EN",
    "BEGIN:VEVENT",
    "UID:duha-moatasem-20261028@invitation",
    "DTSTAMP:20261022T000000Z",
    "DTSTART:20261028T150000Z",
    "DTEND:20261028T170000Z",
    "SUMMARY:Duha & Captain Moatasem",
    "LOCATION:Al Nakheel Palace Hall\\, Irbid",
    "DESCRIPTION:Forever starts here.",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob(
    [calendarEvent],
    { type: "text/calendar;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "Duha-Moatasem.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ===================================
// LOCATION
// ===================================

const mapUrl =
  "https://maps.app.goo.gl/7aCuWpm8ccWfR1ve6" +
  encodeURIComponent("صالة قصر النخيل اربد");

function openLocation() {
  window.open(mapUrl, "_blank", "noopener,noreferrer");
}

$("mapButton").addEventListener("click", openLocation);
$("locationButton").addEventListener("click", openLocation);

// ===================================
// CONTACT & RSVP PLACEHOLDERS
// ===================================

$("contactButton").addEventListener("click", () => {
  alert("Contact details will be added soon.");
});

$("rsvpButton").addEventListener("click", () => {
  alert("RSVP details will be added soon.");
});

// ===================================
// SCROLL ANIMATIONS
// ===================================

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});

// ===================================
// CAMERA WITH FILTER & GOLD FRAME
// ===================================

const cameraModal = $("cameraModal");
const cameraVideo = $("cameraVideo");
const photoCanvas = $("photoCanvas");
const cameraStatus = $("cameraStatus");
const downloadPhoto = $("downloadPhoto");

let cameraStream = null;
let facingMode = "user";
let photoUrl = null;
let cameraRequestId = 0;

async function startCamera() {
  const requestId = ++cameraRequestId;

  stopCamera(false);
  cameraStatus.textContent = "Opening camera...";
  downloadPhoto.hidden = true;

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraStatus.textContent =
      "Camera requires HTTPS or localhost.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 1920 }
      }
    });

    if (requestId !== cameraRequestId || cameraModal.hidden) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    cameraStream = stream;
    cameraVideo.srcObject = stream;
    await cameraVideo.play();

    cameraStatus.textContent = "";
  } catch (error) {
    console.error(error);
    cameraStatus.textContent =
      "Please allow camera access in your browser settings.";
  }
}

function stopCamera(invalidate = true) {
  if (invalidate) cameraRequestId++;

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  cameraVideo.srcObject = null;
}

$("cameraButton").addEventListener("click", () => {
  cameraModal.hidden = false;
  startCamera();
});

$("closeCamera").addEventListener("click", () => {
  stopCamera();
  cameraModal.hidden = true;
});

$("flipCamera").addEventListener("click", () => {
  facingMode =
    facingMode === "user" ? "environment" : "user";

  startCamera();
});

// ===================================
// CAPTURE PHOTO
// ===================================

$("capturePhoto").addEventListener("click", async () => {
  if (!cameraStream || !cameraVideo.videoWidth) {
    cameraStatus.textContent = "Camera is not ready yet.";
    return;
  }

  const canvas = photoCanvas;
  const ctx = canvas.getContext("2d");

  const width = 1080;
  const height = 1440;

  canvas.width = width;
  canvas.height = height;

  const videoWidth = cameraVideo.videoWidth;
  const videoHeight = cameraVideo.videoHeight;

  const scale = Math.max(
    width / videoWidth,
    height / videoHeight
  );

  const cropWidth = width / scale;
  const cropHeight = height / scale;

  const sx = (videoWidth - cropWidth) / 2;
  const sy = (videoHeight - cropHeight) / 2;

  // Warm soft filter
  ctx.save();
  ctx.filter = "sepia(12%) saturate(90%) brightness(106%)";

  ctx.drawImage(
    cameraVideo,
    sx, sy, cropWidth, cropHeight,
    0, 0, width, height
  );

  ctx.restore();

  // Golden warm overlay
  ctx.fillStyle = "rgba(201, 159, 101, 0.09)";
  ctx.fillRect(0, 0, width, height);

  // Golden double frame
  ctx.strokeStyle = "#f0d79c";
  ctx.lineWidth = 5;
  ctx.strokeRect(45, 45, width - 90, height - 90);

  ctx.lineWidth = 2;
  ctx.strokeRect(65, 65, width - 130, height - 130);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff5df";
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 12;

  // Initials
  ctx.font = "36px Georgia, serif";
  ctx.fillText("D  ✦  M", width / 2, 140);

  // Bottom gradient
  const gradient = ctx.createLinearGradient(
    0, 1000, 0, height
  );

  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,.65)");

  ctx.shadowBlur = 0;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 1000, width, 440);

  // Text
  ctx.fillStyle = "#fff5df";
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 10;

  ctx.font = "italic 55px Georgia, serif";
  ctx.fillText(
    "Forever starts here.",
    width / 2,
    1165
  );

  ctx.font = "44px Georgia, serif";
  ctx.fillText(
    "Duha & Captain Moatasem",
    width / 2,
    1240
  );

  ctx.font = "26px Georgia, serif";
  ctx.fillText(
    "28  ·  10  ·  2026",
    width / 2,
    1300
  );

  // Save final photo
  const blob = await new Promise(resolve => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    cameraStatus.textContent = "Could not create photo.";
    return;
  }

  if (photoUrl) URL.revokeObjectURL(photoUrl);

  photoUrl = URL.createObjectURL(blob);

  downloadPhoto.href = photoUrl;
  downloadPhoto.download = "Duha-Moatasem-Photo.png";
  downloadPhoto.hidden = false;

  cameraStatus.textContent = "Your photo is ready!";
});

window.addEventListener("pagehide", () => stopCamera());


/* BRIDAL SPARKLES */

function createSparkle() {
    if (!document.querySelector(".opening:not(.closed)")) {
      return;
    }
  
    const sparkle = document.createElement("span");
    sparkle.textContent = Math.random() > 0.5 ? "✦" : "✧";
  
    sparkle.style.cssText = `
      position: fixed;
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      color: #d5b16d;
      font-size: ${8 + Math.random() * 14}px;
      opacity: 0;
      z-index: 101;
      pointer-events: none;
      transition: opacity 1s, transform 2s;
    `;
  
    document.body.appendChild(sparkle);
  
    requestAnimationFrame(() => {
      sparkle.style.opacity = "0.75";
      sparkle.style.transform = "translateY(-35px)";
    });
  
    setTimeout(() => {
      sparkle.style.opacity = "0";
    }, 1100);
  
    setTimeout(() => sparkle.remove(), 2200);
  }
  
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const sparkleTimer = setInterval(() => {
      if (opening.classList.contains("closed")) {
        clearInterval(sparkleTimer);
        return;
      }
      createSparkle();
    }, 380);
  }
  const weddingAudio = document.getElementById("weddingMusic");

if (weddingAudio) {
  weddingAudio.addEventListener("loadedmetadata", () => {
    weddingAudio.currentTime = 3;
  });
}