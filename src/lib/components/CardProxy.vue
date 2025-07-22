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

const server = import.meta.env.VITE_CDN;

const isShiny = computed(
  () => isDefined(props.number) && props.number.toLowerCase().startsWith("sv")
);
const isGallery = computed(
  () => isDefined(props.number) && !!props.number.match(/^[tg]g/i)
);
const isAlternate = computed(
  () =>
    isDefined(props.id) &&
    altArts.includes(props.id) &&
    !isShiny.value &&
    !isGallery.value
);
const isPromo = computed(() => isDefined(props.set) && props.set === "swshp");

function isDefined(v) {
  return typeof v !== "undefined" && v !== null;
}

const cardImage = computed(() => {
  if (isDefined(props.img)) {
    return props.img;
  }
  if (isDefined(props.set) && isDefined(props.number)) {
    return `https://images.pokemontcg.io/${props.set.toLowerCase()}/${
      props.number
    }_hires.png`;
  }
  return "";
});

const foilMaskImage = (prop, type = "masks") => {
  let etch = "holo";
  let style = "reverse";
  // let ext = "webp";

  if (isDefined(prop)) {
    if (prop === false) {
      return "";
    }
    // return prop;
    return `/public/images/${prop}`;
  }

  if (
    !isDefined(props.rarity) ||
    !isDefined(props.subtypes) ||
    !isDefined(props.supertype) ||
    !isDefined(props.set) ||
    !isDefined(props.number)
  ) {
    return "";
  }

  const fRarity = props.rarity.toLowerCase();
  const fNumber = props.number
    .toString()
    .toLowerCase()
    .replace("swsh", "")
    .padStart(3, "0");
  const fSet = props.set
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

    if (props.subtypes.includes("VMAX")) {
      style = "swsecret";
      // Note: rarity modification removed as it's handled in processedRarity computed
    } else {
      style = "sunpillar";
    }
  }

  if (isPromo.value) {
    let promoStyle = promos[props.id];
    if (promoStyle) {
      style = promoStyle.style.toLowerCase();
      etch = promoStyle.etch.toLowerCase();
      // Note: rarity modifications removed as they're handled in processedRarity computed
    }
  }

  return `${server}/foils/${fSet}/${type}/upscaled/${fNumber}_foil_${etch}_${style}_2x.webp`;
};

const proxy = computed(() => ({
  img: cardImage.value,
  back: props.back,
  foil: foilMaskImage(props.foil, "foils"),
  mask: foilMaskImage(props.mask, "masks"),

  id: props.id,
  name: props.name,
  number: props.number,
  set: props.set,
  types: props.types,
  subtypes: props.subtypes,
  supertype: props.supertype,
  rarity: props.rarity,
  showcase: props.showcase,
}));
</script>

<template>
  <Card v-bind="proxy" />
</template>
