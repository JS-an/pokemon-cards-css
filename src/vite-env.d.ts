/// <reference types="vite/client" />

// Pokemon TCG SDK模块声明
declare module 'pokemontcgsdk' {
  interface CardSearchOptions {
    q?: string;
    select?: string;
    orderBy?: string;
    pageSize?: number;
  }

  interface CardSearchResult {
    data: PokemonCard[];
    page: number;
    pageSize: number;
    count: number;
    totalCount: number;
  }

  interface PokemonTCGSDK {
    configure(options: { apiKey?: string }): void;
    card: {
      where(options: CardSearchOptions): Promise<CardSearchResult>;
    };
  }

  const pokemon: PokemonTCGSDK;
  export default pokemon;
}

// Pokemon卡片类型定义（API返回的原始格式）
interface PokemonCard {
  id: string;
  name: string;
  number: string;
  set: {
    id: string;
    name: string;
    releaseDate: string;
  };
  types?: string[];
  subtypes?: string[];
  supertype: string;
  rarity: string;
  images: {
    small: string;
    large: string;
  };
  isReverse?: boolean;
}

// 处理后的卡片类型（用于应用内部）
interface ProcessedPokemonCard extends Omit<PokemonCard, 'set'> {
  set: string; // 处理后set变为字符串ID
}

// Google Analytics gtag函数类型定义
declare function gtag(
  command: 'config' | 'event' | 'js',
  targetId: string | Date,
  config?: Record<string, any>
): void;

// 扩展Window接口以包含我们添加的全局属性
declare global {
  interface Window {
    cards: ProcessedPokemonCard[]; // Pokemon卡片数据数组（处理后的格式）
    gtag: typeof gtag; // Google Analytics gtag函数
    dataLayer: any[]; // Google Analytics数据层
  }
}
