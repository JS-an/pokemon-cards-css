<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useActiveCardStore } from "../lib/stores";
import { clamp, round, adjust } from "../lib/helpers/Math.js";
import { generateCardClasses } from "../lib/helpers/ClassMapper.js";

// 使用 Pinia stores
const activeCardStore = useActiveCardStore();

const props = defineProps({
  // data props
  id: { type: String, default: "" },
  name: { type: String, default: "" },
  number: { type: String, default: "" },
  set: { type: String, default: "" },
  types: { type: Array, default: () => [] },
  subtypes: { type: String, default: "basic" },
  supertype: { type: String, default: "pokémon" }, // 类型（ trainer / pokémon ）（ 培训师 / 宝可梦 ）
  rarity: { type: String, default: "common" }, // 稀有程度（决定大部分样式的）
  isTrainerGallery: { type: Boolean, default: false }, // 是否是培训师

  // image props
  img: { type: String, default: "" },
  back: { type: String, default: "/public/images/back/card-2x.jpg" },
  foil: { type: String, default: "" },
  mask: { type: String, default: "" },
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

const staticStyles = `
    --seedx: ${randomSeed.x};
    --seedy: ${randomSeed.y};
    --cosmosbg: ${cosmosPosition.x}px ${cosmosPosition.y}px;
  `;

// 响应式变量
const thisCard = ref(null);
const active = ref(false);
const interacting = ref(false);
const loading = ref(true);

// 动画相关的响应式变量
const springRotate = ref({ x: 0, y: 0 });
const springGlare = ref({ x: 50, y: 50, o: 0 });
const springBackground = ref({ x: 50, y: 50 });
const springRotateDelta = ref({ x: 0, y: 0 });
const springTranslate = ref({ x: 0, y: 0 });
const springScale = ref(1);

// 计算属性
const back_img = computed(() => props.back);
const front_img = computed(() => {
  const img_base = props.img.startsWith("http") ? "" : "/public/images/";
  return img_base + props.img;
});
const foilStyles = computed(() => {
  return props.foil
    ? `
      --foil: url(/public/images/${props.foil});
      --mask: url(/public/images/${props.mask});
    `
    : "";
});

// 生成CSS类名
const cardClasses = computed(() => {
  return generateCardClasses({
    rarity: props.rarity,
    subtypes: props.subtypes,
    supertype: props.supertype,
    isTrainerGallery: props.isTrainerGallery,
    set: props.set,
    number: props.number,
    types: props.types
  });
});

// 样式计算
const dynamicStyles = computed(() => {
  return `
      --pointer-x: ${springGlare.value.x}%;
      --pointer-y: ${springGlare.value.y}%;
      --pointer-from-center: ${clamp(
        Math.sqrt(
          (springGlare.value.y - 50) * (springGlare.value.y - 50) +
            (springGlare.value.x - 50) * (springGlare.value.x - 50)
        ) / 50,
        0,
        1
      )};
      --pointer-from-top: ${springGlare.value.y / 100};
      --pointer-from-left: ${springGlare.value.x / 100};
      --card-opacity: ${springGlare.value.o};
      --rotate-x: ${springRotate.value.x + springRotateDelta.value.x}deg;
      --rotate-y: ${springRotate.value.y + springRotateDelta.value.y}deg;
      --background-x: ${springBackground.value.x}%;
      --background-y: ${springBackground.value.y}%;
      --card-scale: ${springScale.value};
      --translate-x: ${springTranslate.value.x}px;
      --translate-y: ${springTranslate.value.y}px;
    `;
});

// 统一更新动画状态的函数
const updateSprings = (background, rotate, glare) => {
  springBackground.value = background;
  springRotate.value = rotate;
  springGlare.value = glare;
};

// 交互方法
const interact = (e) => {
  // 防止其他背景卡片被交互
  if (
    activeCardStore.activeCard &&
    activeCardStore.activeCard !== thisCard.value
  ) {
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
    x: clamp(round((100 / rect.width) * absolute.x)),
    y: clamp(round((100 / rect.height) * absolute.y)),
  };
  const center = {
    x: percent.x - 50,
    y: percent.y - 50,
  };

  updateSprings(
    {
      x: adjust(percent.x, 0, 100, 37, 63),
      y: adjust(percent.y, 0, 100, 33, 67),
    },
    {
      x: round(-(center.x / 3.5)),
      y: round(center.y / 2),
    },
    {
      x: round(percent.x),
      y: round(percent.y),
      o: 1,
    }
  );
};

const interactEnd = (e) => {
  interacting.value = false;
  springRotate.value = { x: 0, y: 0 };
  springGlare.value = { x: 50, y: 50, o: 0 };
  springBackground.value = { x: 50, y: 50 };
};

const activate = (e) => {
  if (active.value) return;

  // 设置当前卡片为活动卡片
  activeCardStore.setActiveCard(thisCard.value);

  // 设置卡片状态
  active.value = true;
  interacting.value = true;
  loading.value = false;

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
};

const deactivate = (e) => {
  if (!active.value) return;

  // 重置卡片状态
  active.value = false;
  interacting.value = false;
  loading.value = false;

  // 重置spring值
  springRotateDelta.value = { x: 0, y: 0 };
  springTranslate.value = { x: 0, y: 0 };
  springScale.value = 1;

  // 清除活动卡片
  activeCardStore.clearActiveCard();
};

const imageLoader = (e) => {
  loading.value = false;
};
</script>

<template>
  <div
    :class="[
      ...cardClasses,
      'interactive',
      { active, interacting, loading, masked: !!mask },
    ]"
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
        :aria-label="`Expand the Card; ${name}.`"
        tabindex="0"
      >
        <img
          class="card__back"
          :src="back_img"
          alt="The back of a Card"
          loading="lazy"
        />
        <div class="card__front" :style="staticStyles + foilStyles">
          <img
            :src="front_img"
            :alt="name"
            @load="imageLoader"
            loading="lazy"
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
  aspect-ratio: 9 / 16;
  transform-style: preserve-3d;
  transform-origin: center;
  perspective: 2000px;
  will-change: transform;
  transition: z-index 0.2s;
}
</style>
