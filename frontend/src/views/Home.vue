<template>
  <div class="vh-100 overflow-hidden">
    <nav class="navbar navbar-expand-lg navbar-light bg-white">
      <div class="container-fluid">
        <a
          class="navbar-brand text-muted"
          href="#"
          @click="$router.push({ name: 'Home' })"
          >SIT Cloud Meet</a
        >
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarText"
          aria-controls="navbarText"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarText">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0"></ul>
          <span class="navbar-text">{{ currentTime }}</span>
        </div>
      </div>
    </nav>
    <div
      class="container h-100 d-flex align-items-center"
      style="margin-top: -4rem"
    >
      <div class="row w-100">
        <div class="col-12 col-md-8 mb-5">
          <div style="max-width: 100%; width: 500px">
            <h1 class="fw-normal">Simple one to one video calls</h1>
            <p class="text-muted">
              Create or join video call from below, simple!
            </p>

            <div class="d-block d-md-flex align-items-center">
              <div class="flex-shrink-0">
                <button
                  class="btn rounded-0 me-3 mb-3 btn-primary shadow-none"
                  @click="
                    $router.push({ name: 'Meet', params: { meetID: v4() } })
                  "
                >
                  New Meeting
                </button>
              </div>

              <div class="input-group me-3 mb-3 border">
                <span
                  class="input-group-text bg-white border-0 bi fs-4 bi-keyboard"
                  id="basic-addon1"
                ></span>
                <input
                  type="text"
                  class="form-control rounded-0 border-0 shadow-none"
                  placeholder="Enter code or link"
                  aria-label="Username"
                  aria-describedby="basic-addon1"
                />
              </div>
              <a href="#" class="mb-3 text-decoration-none">Join</a>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <img
            class="w-100"
            src="../assets/undraw_everywhere_together_bdmn.svg"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
//import HelloWorld from "@/components/HelloWorld.vue";
import dayjs from "dayjs";
import { v4 } from "uuid";
import { computed, onBeforeUnmount, ref } from "@vue/runtime-core";

export default {
  name: "Home",
  setup() {
    const currentTime = ref(dayjs().format("HH:mm A • ddd, MMM DD"));
    var interval;
    interval = setInterval(() => {
      currentTime.value = dayjs().format("HH:mm A • ddd, MMM DD");
    }, 60000);
    onBeforeUnmount(() => {
      clearInterval(interval);
    });
    return { currentTime, v4 };
  },
};
</script>
