<script setup>
import pokemon from "pokemontcgsdk";
import { onMounted, ref, computed, watch } from "vue";

import CardList from "./Cards.vue";
import Card from "./lib/components/CardProxy.vue";

const props = defineProps({
  query: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:query"]);

const query = computed({
  get: () => props.query,
  set: (value) => emit("update:query", value),
});

const loadingQuery = ref(true);
let queryTimer;
const queryResult = ref([]);
const isError = ref(false);

pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY });

const loadQuery = async () => {
  if (!usableQuery.value) {
    return;
  }

  loadingQuery.value = true;
  clearTimeout(queryTimer);
  queryTimer = setTimeout(() => {
    pokemon.card

      .where({
        q: `( set.id:swsh* AND name:"*${query.value}*" )`,
        select: `id,name,number,supertype,subtypes,rarity,images,types,set`,
        orderBy: `-set.releaseDate,-number`,
        pageSize: 36,
      })

      .then((result) => {
        const cards = result.data || [];

        queryResult.value = [];
        isError.value = false;

        let cardsMap = cards.slice(0, 36).map((card) => {
          if (card.rarity === "Common" || card.rarity === "Uncommon") {
            card.isReverse = !!Math.round(Math.random());
          }
          card.set = card.set.id;
          return card;
        });

        queryResult.value = [...cardsMap];
        loadingQuery.value = false;
      })

      .catch((a, b, c) => {
        queryResult.value = [];
        loadingQuery.value = false;
        isError.value = true;
      });

    gtag("event", "search", {
      search_term: query.value,
    });
  }, 666);
};

const usableQuery = computed(() => query.value.length > 2);

watch(query, () => {
  if (query.value) {
    loadQuery();
  }
});
</script>

<template>
  <section class="search-area">
    <input
      type="search"
      name="search"
      id="search"
      v-model="query"
      placeholder="eg: Morpeko or Marnie"
    />

    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="icon icon-tabler icon-tabler-search"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="1.25"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
      <path d="M21 21l-6 -6"></path>
    </svg>
  </section>

  <h3 v-if="!query">Browse cards below, Or search for your favourite!</h3>

  <h3 v-if="usableQuery && loadingQuery">Fetching Cards...</h3>

  <CardList v-if="usableQuery && queryResult.length">
    <Card
      v-for="card in queryResult"
      :key="card.id"
      :id="card.id"
      :name="card.name"
      :set="card.set"
      :number="card.number"
      :types="card.types"
      :supertype="card.supertype"
      :subtypes="card.subtypes"
      :rarity="card.rarity"
      :isReverse="card.isReverse"
    />
  </CardList>

  <div v-if="isError || (usableQuery && !loadingQuery && !queryResult.length)">
    <h3>Error: No cards found with that name.</h3>

    <CardList>
      <Card
        id="basep-16"
        name="Computer Error"
        set="basep"
        number="16"
        img="https://images.pokemontcg.io/basep/16_hires.png"
        supertype="Trainer"
        subtypes="Rocket's Secret Machine"
        rarity="Promo"
        :isReverse="false"
      />
    </CardList>
  </div>
</template>

<style>
.search-area {
  font-size: 18px;
  display: grid;
  place-items: center start;
  max-width: 500px;
  margin: 120px 0 10px;
  padding: 5px;
  position: sticky;
  top: 10px;
  border-radius: 0.66em;
  backdrop-filter: blur(5px);
  z-index: 999;
}

@media screen and (min-width: 900px) {
  .search-area {
    margin: 120px 50px 0;
    font-size: 22px;
  }
  h3 {
    margin-inline: 60px;
  }
}

input {
  font-family: Roboto;
  font-size: inherit;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5em;
  padding: 0.5em 2em 0.5em 0.75em;
  margin: 0;
  background: hsla(220, 7%, 17%, 0.66);
  color: white;
  outline: none;
  transition: all 0.5s ease;
  box-shadow: 0 5px 20px hsla(220, 7%, 20%, 0.75),
    0 5px 10px hsla(220, 7%, 20%, 0.75);

  grid-row: 1;
  grid-column: 1;
  width: 100%;
}

input:active,
input:focus,
input:hover {
  background: hsla(220, 7%, 17%, 0.88);
}

input:active,
input:focus {
  border: 1px solid var(--primary);
}

.icon-tabler-search {
  grid-row: 1;
  grid-column: 1;
  place-self: center end;
  margin-right: 10px;
  opacity: 0.5;
  transition: all 0.5s ease;
}

input:active + .icon,
input:focus + .icon,
input:hover + .icon {
  opacity: 0.2;
}

h3 {
  font-family: Roboto;
  font-size: inherit;
  font-weight: normal;
  margin-block: 10px;
}
</style>
