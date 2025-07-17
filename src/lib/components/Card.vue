<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { activeCard } from "../stores/activeCard.js";
import { useOrientation, resetBaseOrientation } from "../stores/orientation.js";
import { clamp, round, adjust } from "../helpers/Math.js";

const props = defineProps({
  // data / pokemon props
  id: { type: String, default: "" },
  name: { type: String, default: "" },
  number: { type: String, default: "" },
  set: { type: String, default: "" },
  types: { type: Array, default: () => [] },
  subtypes: { type: String, default: "basic" },
  supertype: { type: String, default: "pokémon" },
  rarity: { type: String, default: "common" },

  // image props
  img: { type: String, default: "" },
  back: {
    type: String,
    default: "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg",
  },
  foil: { type: String, default: "" },
  mask: { type: String, default: "" },

  // context/environment props
  showcase: { type: Boolean, default: false },
});

// 随机种子用于cosmos位置
const randomSeed = {
  x: Math.random(),
  y: Math.random(),
};

const cosmosPosition = {
  x: Math.floor(randomSeed.x * 734),
  y: Math.floor(randomSeed.y * 1280),
};

// 响应式变量
const thisCard = ref(null);
const active = ref(false);
const interacting = ref(false);
const loading = ref(true);
const firstPop = ref(true);
const isVisible = ref(document.visibilityState === "visible");

// 动画相关的响应式变量
const springRotate = ref({ x: 0, y: 0 });
const springGlare = ref({ x: 50, y: 50, o: 0 });
const springBackground = ref({ x: 50, y: 50 });
const springRotateDelta = ref({ x: 0, y: 0 });
const springTranslate = ref({ x: 0, y: 0 });
const springScale = ref(1);

// 定时器
let repositionTimer;
let showcaseInterval;
let showcaseTimerStart;
let showcaseTimerEnd;
let showcaseRunning = props.showcase;

// 计算属性
const back_img = computed(() => props.back);
const front_img = computed(() => {
  const img_base = props.img.startsWith("http")
    ? ""
    : "https://images.pokemontcg.io/";
  return img_base + props.img;
});

const isTrainerGallery = computed(() => {
  return props.number && !!props.number.match(/^[tg]g/i);
});

// 样式计算
const staticStyles = computed(() => {
  return `
      --mx: ${springBackground.value.x}%;
      --my: ${springBackground.value.y}%;
      --posx: ${springBackground.value.x}%;
      --posy: ${springBackground.value.y}%;
      --hyp: ${clamp(
        Math.sqrt(
          (springGlare.value.x - 50) * (springGlare.value.x - 50) +
            (springGlare.value.y - 50) * (springGlare.value.y - 50)
        ) / 50,
        0,
        1
      )};
    `;
});

const foilStyles = computed(() => {
  return props.foil
    ? `
      --foil-opacity: 1;
      --foil: url(${props.foil});
    `
    : "";
});

const dynamicStyles = computed(() => {
  return `
      --rx: ${springRotate.value.x + springRotateDelta.value.x}deg;
      --ry: ${springRotate.value.y + springRotateDelta.value.y}deg;
      --pos-x: ${springGlare.value.x}%;
      --pos-y: ${springGlare.value.y}%;
      --glow-opacity: ${springGlare.value.o};
      --scale: ${springScale.value};
      --tx: ${springTranslate.value.x}px;
      --ty: ${springTranslate.value.y}px;
      --cosmos-x: ${cosmosPosition.x}px;
      --cosmos-y: ${cosmosPosition.y}px;
      --cosmos-opacity: ${springGlare.value.o};
    `;
});

// 结束showcase模式
const endShowcase = () => {
  if (showcaseRunning) {
    clearTimeout(showcaseTimerEnd);
    clearTimeout(showcaseTimerStart);
    clearInterval(showcaseInterval);
    showcaseRunning = false;
  }
};

// 交互方法
const interact = (e) => {
  endShowcase();

  if (!isVisible.value) {
    return (interacting.value = false);
  }

  // 防止其他背景卡片被交互
  if (activeCard.value && activeCard.value !== thisCard.value) {
    return (interacting.value = false);
  }

  interacting.value = true;

  if (e.type === "touchmove") {
    e.clientX = e.touches[0].clientX;
    e.clientY = e.touches[0].clientY;
  }

  const $el = e.target;
  const rect = $el.getBoundingClientRect();
  const absolute = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  const percent = {
    x: absolute.x / rect.width,
    y: absolute.y / rect.height,
  };
  const center = {
    x: percent.x - 0.5,
    y: percent.y - 0.5,
  };
  const maxRotation = 32.5;

  // 设置旋转
  springRotate.value = {
    x: round(-(center.x * maxRotation)),
    y: round(center.y * maxRotation),
  };

  // 设置光晕
  springGlare.value = {
    x: percent.x * 100,
    y: percent.y * 100,
    o: 1,
  };

  // 设置背景位置
  springBackground.value = {
    x: round(40 + percent.x * 20),
    y: round(40 + percent.y * 20),
  };
};

const interactEnd = (e, delay = 500) => {
  setTimeout(() => {
    interacting.value = false;

    springRotate.value = { x: 0, y: 0 };
    springGlare.value = { x: 50, y: 50, o: 0 };
    springBackground.value = { x: 50, y: 50 };
  }, delay);
};

const activate = (e) => {
  if (active.value) return;

  // 如果有活动卡片且不是当前卡片，则停用它
  if (activeCard.value && activeCard.value !== thisCard.value) {
    activeCard.value.dispatchEvent(new CustomEvent("revert"));
  }

  // 设置当前卡片为活动卡片
  activeCard.value = thisCard.value;

  // 设置卡片状态
  active.value = true;
  interacting.value = true;
  loading.value = false;
  firstPop.value = false;

  // 1秒后重置firstPop
  setTimeout(() => {
    firstPop.value = true;
  }, 1000);

  // 5.5秒后停止交互
  setTimeout(() => {
    interacting.value = false;
  }, 5500);

  // 设置弹出框设置
  const rect = thisCard.value.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;
  const cardCenterX = rect.left + rect.width / 2;
  const cardCenterY = rect.top + rect.height / 2;

  // 设置spring值
  springRotateDelta.value = { x: 0, y: 0 };
  springTranslate.value = {
    x: centerX - cardCenterX,
    y: centerY - cardCenterY,
  };
  springScale.value = 1.5;

  // 设置重新定位定时器
  clearTimeout(repositionTimer);
  repositionTimer = setTimeout(() => {
    reposition();
  }, 100);
};

const reposition = () => {
  if (!active.value) return;

  const rect = thisCard.value.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;
  const cardCenterX = rect.left + rect.width / 2;
  const cardCenterY = rect.top + rect.height / 2;

  springTranslate.value = {
    x: centerX - cardCenterX,
    y: centerY - cardCenterY,
  };
};

const deactivate = (e) => {
  if (!active.value) return;

  // 重置卡片状态
  active.value = false;
  interacting.value = false;
  loading.value = false;
  firstPop.value = true;

  // 重置spring值
  springRotateDelta.value = { x: 0, y: 0 };
  springTranslate.value = { x: 0, y: 0 };
  springScale.value = 1;

  // 清除活动卡片
  activeCard.value = undefined;

  // 清除重新定位定时器
  clearTimeout(repositionTimer);
};

const imageLoader = (e) => {
  loading.value = false;
};

// 生命周期
onMounted(() => {
  // 初始化状态
  loading.value = true;
  active.value = false;
  interacting.value = false;
  firstPop.value = true;
  isVisible.value = document.visibilityState === "visible";

  // 设置可见性变化监听器
  document.addEventListener("visibilitychange", () => {
    isVisible.value = document.visibilityState === "visible";
  });

  // 设置revert监听器
  if (thisCard.value) {
    thisCard.value.addEventListener("revert", deactivate);
  }

  // 设置showcase
  if (props.showcase) {
    showcaseRunning = true;
    showcaseTimerStart = setTimeout(() => {
      if (showcaseRunning) {
        activate();
        showcaseInterval = setInterval(() => {
          if (showcaseRunning) {
            interact({
              target: thisCard.value,
              clientX: Math.random() * thisCard.value.offsetWidth,
              clientY: Math.random() * thisCard.value.offsetHeight,
            });
          }
        }, 2000);
        showcaseTimerEnd = setTimeout(() => {
          if (showcaseRunning) {
            deactivate();
            interactEnd(null, 0);
          } else {
            interacting.value = false;
            active.value = false;
            return;
          }
        }, 4000);
      } else {
        interacting.value = false;
        active.value = false;
        return;
      }
    }, 2000);
  }
});
</script>

<template>
  <div
    :class="[
      'card',
      types,
      'interactive',
      { active, interacting, loading, masked: !!mask },
    ]"
    :data-number="number"
    :data-set="set"
    :data-subtypes="subtypes"
    :data-supertype="supertype"
    :data-rarity="rarity"
    :style="dynamicStyles"
    ref="thisCard"
  >
    <div class="card__translater">
      <button
        class="card__rotator"
        @click="activate"
        @pointermove="interact"
        @mouseout="interactEnd"
        @blur="deactivate"
        :aria-label="`Expand the Pokemon Card; ${name}.`"
        tabindex="0"
      >
        <img
          class="card__back"
          :src="back_img"
          alt="The back of a Pokemon Card, a Pokeball in the center with Pokemon logo above and below"
          loading="lazy"
          width="660"
          height="921"
        />
        <div class="card__front" :style="staticStyles + foilStyles">
          <img
            :src="front_img"
            :alt="`Front design of the ${name} Pokemon Card, with the stats and info around the edge`"
            @load="imageLoader"
            loading="lazy"
            width="660"
            height="921"
          />
          <div class="card__shine"></div>
          <div class="card__glare"></div>
        </div>
      </button>
    </div>
  </div>
</template>

<style>
/* 卡片基本样式 */
.card {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 660 / 921;
  transform-style: preserve-3d;
  transform-origin: center;
  perspective: 2000px;
  will-change: transform;
  transition: z-index 0.2s;
}

.card.active {
  z-index: 2;
}

.card__translater {
  width: 100%;
  height: 100%;
  transform: translate3d(var(--tx, 0), var(--ty, 0), 0);
  transition: transform 0.2s ease-out;
}

.card__rotator {
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background: none;
  cursor: pointer;
  transform: scale(var(--scale, 1)) rotateY(var(--rx, 0)) rotateX(var(--ry, 0));
  transition: transform 0.2s ease-out;
  transform-style: preserve-3d;
}

.card.interacting .card__rotator {
  transition: transform 0.1s ease-out;
}

.card__back,
.card__front {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  overflow: hidden;
  border-radius: 4.5% / 3.5%;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.2);
}

.card__back {
  transform: rotateY(180deg);
  background-color: #070707;
}

.card__front {
  background-position: var(--mx, 50%) var(--my, 50%);
  background-size: cover;
}

.card__front img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translateZ(0);
}

.card__shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
    farthest-corner circle at var(--pos-x, 50%) var(--pos-y, 50%),
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.65) 15%,
    rgba(255, 255, 255, 0) 60%
  );
  opacity: var(--glow-opacity, 0);
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.card__glare {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
    farthest-corner circle at var(--pos-x, 50%) var(--pos-y, 50%),
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0) 80%
  );
  opacity: var(--glow-opacity, 0);
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* 卡片类型样式 */
.card.fire {
  --card-color: #ff9c54;
}

.card.water {
  --card-color: #5090d6;
}

.card.grass {
  --card-color: #63bc5a;
}

.card.electric {
  --card-color: #f4d23c;
}

.card.psychic {
  --card-color: #fa7179;
}

.card.fighting {
  --card-color: #ce416b;
}

.card.darkness {
  --card-color: #5a5465;
}

.card.metal {
  --card-color: #5a8ea2;
}

.card.fairy {
  --card-color: #ec8fe6;
}

.card.dragon {
  --card-color: #0b6dc3;
}

.card.colorless {
  --card-color: #9da0aa;
}
</style>
