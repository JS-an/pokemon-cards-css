<script setup>
import { computed } from "vue";
import altArts from "./alternate-arts.json";
import promos from "./promos.json";
import Card from "./Card.vue";

const props = defineProps({
  // data / pokemon props
  id: { type: String, default: undefined },
  name: { type: String, default: undefined },
  number: { type: String, default: undefined },
  set: { type: String, default: undefined },
  types: { type: Array, default: undefined },
  subtypes: { type: String, default: undefined },
  supertype: { type: String, default: undefined },
  rarity: { type: String, default: undefined },
  isReverse: { type: Boolean, default: false },

  // image props
  img: { type: String, default: undefined },
  back: { type: String, default: undefined },
  foil: { type: String, default: undefined },
  mask: { type: String, default: undefined },

  // context/environment props
  showcase: { type: Boolean, default: false },
});

// 使用props直接访问以保持响应性
const {
  id,
  name,
  number,
  set,
  types,
  subtypes,
  supertype,
  rarity,
  isReverse,
  img,
  back,
  foil,
  mask,
  showcase,
} = props;

const server = import.meta.env.VITE_CDN;

const isShiny = computed(
  () => isDefined(number) && number.toLowerCase().startsWith("sv")
);
const isGallery = computed(
  () => isDefined(number) && !!number.match(/^[tg]g/i)
);
const isAlternate = computed(
  () =>
    isDefined(id) && altArts.includes(id) && !isShiny.value && !isGallery.value
);
const isPromo = computed(() => isDefined(set) && set === "swshp");
const processedRarity = computed(() => {
  let processedRarity = rarity;

  if (isReverse) {
    processedRarity = processedRarity + " Reverse Holo";
  }

  if (isGallery.value) {
    if (
      isDefined(processedRarity) &&
      processedRarity.startsWith("Trainer Gallery")
    ) {
      processedRarity = processedRarity.replace(/Trainer Gallery\s*/, "");
    }
    if (
      isDefined(processedRarity) &&
      processedRarity.includes("Rare Holo V") &&
      isDefined(subtypes) &&
      subtypes.includes("VMAX")
    ) {
      processedRarity = "Rare Holo VMAX";
    }
    if (
      isDefined(processedRarity) &&
      processedRarity.includes("Rare Holo V") &&
      isDefined(subtypes) &&
      subtypes.includes("VSTAR")
    ) {
      processedRarity = "Rare Holo VSTAR";
    }
  }

  if (isPromo.value) {
    if (id === "swshp-SWSH076" || id === "swshp-SWSH077") {
      processedRarity = "Rare Secret";
    } else if (isDefined(subtypes) && subtypes.includes("V")) {
      processedRarity = "Rare Holo V";
    } else if (isDefined(subtypes) && subtypes.includes("V-UNION")) {
      processedRarity = "Rare Holo VUNION";
    } else if (isDefined(subtypes) && subtypes.includes("VMAX")) {
      processedRarity = "Rare Holo VMAX";
    } else if (isDefined(subtypes) && subtypes.includes("VSTAR")) {
      processedRarity = "Rare Holo VSTAR";
    } else if (isDefined(subtypes) && subtypes.includes("Radiant")) {
      processedRarity = "Radiant Rare";
    }
  }

  return processedRarity;
});

function isDefined(v) {
  return typeof v !== "undefined" && v !== null;
}

function isArray(v) {
  return typeof v !== "undefined" && Array.isArray(v);
}

const cardImage = computed(() => {
  console.log("cardImage", img, set, number);
  if (isDefined(img)) {
    return img;
  }
  if (isDefined(set) && isDefined(number)) {
    return `https://images.pokemontcg.io/${set.toLowerCase()}/${number}_hires.png`;
  }
  return "";
});

const foilMaskImage = (prop, type = "masks") => {
  let etch = "holo";
  let style = "reverse";
  let ext = "webp";

  if (isDefined(prop)) {
    if (prop === false) {
      return "";
    }
    return prop;
  }

  if (
    !isDefined(processedRarity.value) ||
    !isDefined(subtypes) ||
    !isDefined(supertype) ||
    !isDefined(set) ||
    !isDefined(number)
  ) {
    return "";
  }

  const fRarity = processedRarity.value.toLowerCase();
  const fNumber = number
    .toString()
    .toLowerCase()
    .replace("swsh", "")
    .padStart(3, "0");
  const fSet = set
    .toString()
    .toLowerCase()
    .replace(/(tg|gg|sv)/, "");

  if (fRarity === "rare holo") {
    style = "swholo";
  }

  if (fRarity === "rare holo cosmos") {
    style = "cosmos";
  }

  if (fRarity === "radiant rare") {
    etch = "etched";
    style = "radiantholo";
  }

  if (
    fRarity === "rare holo v" ||
    fRarity === "rare holo vunion" ||
    fRarity === "basic v"
  ) {
    etch = "holo";
    style = "sunpillar";
  }

  if (
    fRarity === "rare holo vmax" ||
    fRarity === "rare ultra" ||
    fRarity === "rare holo vstar"
  ) {
    etch = "etched";
    style = "sunpillar";
  }

  if (
    fRarity === "amazing rare" ||
    fRarity === "rare rainbow" ||
    fRarity === "rare secret"
  ) {
    etch = "etched";
    style = "swsecret";
  }

  if (isShiny.value) {
    etch = "etched";
    style = "sunpillar";

    if (
      fRarity === "rare shiny v" ||
      (fRarity === "rare holo v" && fNumber.startsWith("sv"))
    ) {
      // Note: rarity modification removed as it's handled in processedRarity computed
    }

    if (
      fRarity === "rare shiny vmax" ||
      (fRarity === "rare holo vmax" && fNumber.startsWith("sv"))
    ) {
      style = "swsecret";
      // Note: rarity modification removed as it's handled in processedRarity computed
    }
  }

  if (isGallery.value) {
    etch = "holo";
    style = "rainbow";

    if (fRarity.includes("rare holo v") || fRarity.includes("rare ultra")) {
      etch = "etched";
      style = "sunpillar";
    }

    if (fRarity.includes("rare secret")) {
      etch = "etched";
      style = "swsecret";
    }
  }

  if (isAlternate.value) {
    etch = "etched";

    if (subtypes.includes("VMAX")) {
      style = "swsecret";
      // Note: rarity modification removed as it's handled in processedRarity computed
    } else {
      style = "sunpillar";
    }
  }

  if (isPromo.value) {
    let promoStyle = promos[id];
    if (promoStyle) {
      style = promoStyle.style.toLowerCase();
      etch = promoStyle.etch.toLowerCase();
      // Note: rarity modifications removed as they're handled in processedRarity computed
    }
  }

  // return `${server}/foils/${fSet}/${type}/upscaled/${fNumber}_foil_${etch}_${style}_2x.${ext}`;
  return type === "foils" ? props.foil : props.mask;
};

const foilImage = computed(() => {
  return foilMaskImage(foil, "foils");
});

const maskImage = computed(() => {
  return foilMaskImage(mask, "masks");
});

const proxy = computed(() => ({
  img: cardImage.value,
  back,
  foil: foilImage.value,
  mask: maskImage.value,

  id,
  name,
  number,
  set,
  types,
  subtypes,
  supertype,
  rarity: processedRarity.value,
  showcase,
}));
</script>

<template>
  <Card v-bind="proxy" />
</template>
