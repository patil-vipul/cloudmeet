<template>
  <div class="vh-100 w-100 bg-dark">
    <div
      class="position-absolute end-0 d-flex bg-white align-items-center"
      style="z-index: 1"
    >
      <button class="bi mx-3 shadow-none bi-chat-left-text btn"></button>
      <p class="m-0 mx-3 text-muted">{{ currentTime }}</p>
      <div style="height: 50px">
        <video autoplay muted :src-object.prop.camel="localStream" class="h-100" />
      </div>
    </div>

    <div
      v-if="notification"
      class="position-absolute m-5 rounded p-2 shadow bg-white align-items-center"
      style="z-index: 1"
    >
      <div class="d-flex justify-content-between align-items-center">
        <p class="m-0">{{ notification.title }}</p>
        <i class="bi bi-x fs-4" @click="notification = null"></i>
      </div>
      <p class="text-muted mb-1">Some example content</p>
    </div>
    <div class="h-100 d-flex overflow-hidden flex-column" style="z-index: 10">
      <div class="flex-fill overflow-hidden position-relative">
        <video
          autoplay
          
          :src-object.prop.camel="remoteStream"
          class="h-100 w-100"
        />
      </div>
      <div class="bg-white flex-1 w-100 text-center py-2">
        <button
          class="border mx-2 p-0 rounded-circle border-dark btn"
          style="height: 40px; width: 40px"
        >
          <i class="bi w-100 h-100 bi-mic"></i>
        </button>
        <button
          class="border border-danger text-danger p-0 mx-2 rounded-circle btn"
          style="transform: rotate(135deg); height: 40px; width: 40px"
        >
          <i class="bi w-100 h-100 bi-telephone"></i>
        </button>
        <button
          style="height: 40px; width: 40px"
          class="border p-0 mx-2 rounded-circle border-dark btn"
        >
          <i class="bi w-100 h-100 bi-camera-video"></i>
        </button>
      </div>
    </div>
  </div>
</template>


<script>
import dayjs from "dayjs";
import io from "socket.io-client";
import { ref } from "@vue/reactivity";
import { onBeforeUnmount } from "@vue/runtime-core";
export default {
  name: "Meet",
  props: {
    meetID: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const currentTime = ref(dayjs().format("HH:mm A"));
    const notification = ref(null);
    const localStream = ref(null);
    const remoteStream = ref(new MediaStream());
    const socket = io("/");
    var setNotification = (title, message) =>
      (notification.value = { title, message });
    var interval = setInterval(() => {
      currentTime.value = dayjs().format("HH:mm A");
    }, 60000);
    const servers = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    };
    var pc = new RTCPeerConnection(servers);
    pc.onicecandidate = (event) => {
      console.log("Sending candidates");
      console.log(event.candidate);
      event.candidate &&
        socket.emit("iceCandidate", {
          meetID: props.meetID,
          candidate: event.candidate,
        });
    };
    pc.ontrack = (event) => {
      console.log("PC add track");
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.value.addTrack(track);
      });
    };
    var offerDescription;
    var answerDescription;
    var iceCandidate = [];

   
    async function loadMedia() {
      var stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
      });
      console.log("one");
      localStream.value = stream;
    }

    socket.on("connect", async () => {
      await loadMedia();
      socket.emit("join", { meetID: props.meetID });
    });
    socket.on("created", () => {
      setNotification("Meeting created");
    });
    socket.on("joined", () => {
      setNotification("Meeting joined");
      console.log("two");
      localStream.value.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.value);
      });
      socket.emit("initiateWebRTC", { meetID: props.meetID });
      console.log("Initiate WebRTC request sent");
    });
    socket.on("roomFull", () => setNotification("Meeting full"));
    socket.on("initiateWebRTC", () => {
      localStream.value.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.value);
      });
      console.log("WebRTC Request recieved");
      pc.createOffer().then((offer) => {
        offerDescription = offer;
        pc.setLocalDescription(offerDescription).then(() => {
          socket.emit("offer", {
            meetID: props.meetID,
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          });
          console.log("Offer sent");
        });
      });
    });
    socket.on("offer", (offer) => {
      offerDescription = new RTCSessionDescription(offer);
      pc.setRemoteDescription(offerDescription).then(() => {
        console.log("Offer Recieved : remoteDescriptionSet");

        pc.createAnswer().then((answer) => {
          answerDescription = answer;
          pc.setLocalDescription(answerDescription);
          socket.emit("answer", {
            meetID: props.meetID,
            sdp: answerDescription.sdp,
            type: answerDescription.type,
          });
          console.log("Answer Sent");
        });
      });
    });
    socket.on("answer", (answer) => {
      answerDescription = new RTCSessionDescription(answer);
      pc.setRemoteDescription(answerDescription).then(() => {
        console.log("adding candidates", iceCandidate);

        iceCandidate.forEach((candidate) => {
          pc.addIceCandidate(candidate);
        });

        console.log("Answer Recieved : remoteDescriptionSet");
      });
    });
    socket.on("iceCandidate", (candidateData) => {
      console.log("Candidate Recieved");
      var candidate = new RTCIceCandidate(candidateData.candidate);
      if (!pc.remoteDescription) {
        console.log("pushing to ice queue");
        return iceCandidate.push(candidate);
      }
      console.log("Candidate Added");
      pc.addIceCandidate(candidate);
    });
    onBeforeUnmount(() => {
      clearInterval(interval);
    });
    return { currentTime, notification, localStream, remoteStream };
  },
};
</script>

<style>
</style>