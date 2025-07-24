/**
 * Pokemon Cards CSS 属性到类名映射工具
 * 根据映射表将原始属性值转换为对应的CSS类名
 */

/**
 * 将rarity属性值转换为对应的CSS类名
 * @param {string} rarity - 原始的rarity值
 * @returns {string} 对应的CSS类名
 */
export function mapRarityToClass(rarity) {
  if (!rarity) return '';
  
  const rarityLower = rarity.toLowerCase();
  
  // 精确匹配映射
  const exactMappings = {
    'rare holo': 'holo',
    'rare holo cosmos': 'holo-cosmos',
    'rare holo v': 'holo-v',
    'rare holo vmax': 'holo-vmax',
    'rare holo vstar': 'holo-vstar',
    'rare ultra': 'ultra',
    'rare secret': 'secret',
    'rare shiny': 'shiny',
    'rare shiny v': 'shiny-v',
    'rare shiny vmax': 'shiny-vmax',
    'rare rainbow': 'rainbow',
    'rare rainbow alt': 'rainbow-alt',
    'amazing rare': 'amazing',
    'radiant rare': 'radiant',
    'trainer gallery rare holo': 'trainer-gallery-holo'
  };

  // 检查精确匹配
  if (exactMappings[rarityLower]) {
    return exactMappings[rarityLower];
  }

  // 包含匹配处理
  if (rarityLower.endsWith('reverse holo')) {
    return 'reverse-holo';
  }
  
  if (rarityLower.includes('rare shiny')) {
    return 'shiny';
  }

  // 如果没有匹配，返回原值的简化版本
  return rarityLower.replace(/\s+/g, '-');
}

/**
 * 将subtypes属性值转换为对应的CSS类名
 * @param {string} subtypes - 原始的subtypes值
 * @returns {string} 对应的CSS类名
 */
export function mapSubtypesToClass(subtypes) {
  if (!subtypes) return '';
  
  const subtypesLower = subtypes.toLowerCase();
  
  // 精确匹配
  if (subtypesLower === 'v-union') {
    return 'v-union';
  }
  
  // 包含匹配处理
  if (subtypesLower.startsWith('stage')) {
    return `stage-${subtypesLower.replace('stage ', '')}`;
  }
  
  if (subtypesLower.includes('supporter')) {
    return 'supporter';
  }
  
  if (subtypesLower.includes('item')) {
    return 'item';
  }
  
  // 处理其他常见的subtypes
  return subtypesLower.replace(/\s+/g, '-');
}

/**
 * 将supertype属性值转换为对应的CSS类名
 * @param {string} supertype - 原始的supertype值
 * @returns {string} 对应的CSS类名
 */
export function mapSupertypeToClass(supertype) {
  if (!supertype) return '';
  
  const supertypeLower = supertype.toLowerCase();
  
  const mappings = {
    'pokémon': 'pokemon',
    'pokemon': 'pokemon',
    'trainer': 'trainer'
  };
  
  return mappings[supertypeLower] || supertypeLower;
}

/**
 * 将trainer-gallery布尔值转换为对应的CSS类名
 * @param {boolean} isTrainerGallery - 是否为trainer gallery
 * @returns {string} 对应的CSS类名
 */
export function mapTrainerGalleryToClass(isTrainerGallery) {
  return isTrainerGallery ? 'trainer-gallery' : '';
}

/**
 * 将set属性值转换为对应的CSS类名
 * @param {string} set - 原始的set值
 * @returns {string} 对应的CSS类名
 */
export function mapSetToClass(set) {
  if (!set) return '';
  
  const setLower = set.toLowerCase();
  
  // 特殊映射
  const mappings = {
    'swshp': 'swshp'
  };
  
  return mappings[setLower] || setLower;
}

/**
 * 将number属性值转换为对应的CSS类名
 * @param {string} number - 原始的number值
 * @returns {string} 对应的CSS类名
 */
export function mapNumberToClass(number) {
  if (!number) return '';
  
  const numberLower = number.toLowerCase();
  
  // 特殊映射
  const mappings = {
    'swsh145': 'swsh145',
    'swsh020': 'swsh020',
    '160': 'swsh160' // 针对swsh12pt5系列的特殊处理
  };
  
  return mappings[numberLower] || numberLower;
}

/**
 * 组合所有属性生成完整的CSS类名数组
 * @param {Object} props - 包含所有属性的对象
 * @returns {Array} CSS类名数组
 */
export function generateCardClasses(props) {
  const classes = [];
  
  // 基础类名
  classes.push('card');
  
  // 添加rarity类名
  const rarityClass = mapRarityToClass(props.rarity);
  if (rarityClass) {
    classes.push(rarityClass);
  }
  
  // 添加subtypes类名
  const subtypesClass = mapSubtypesToClass(props.subtypes);
  if (subtypesClass) {
    classes.push(subtypesClass);
  }
  
  // 添加supertype类名
  const supertypeClass = mapSupertypeToClass(props.supertype);
  if (supertypeClass) {
    classes.push(supertypeClass);
  }
  
  // 添加trainer-gallery类名
  const trainerGalleryClass = mapTrainerGalleryToClass(props.isTrainerGallery);
  if (trainerGalleryClass) {
    classes.push(trainerGalleryClass);
  }
  
  // 添加set类名
  const setClass = mapSetToClass(props.set);
  if (setClass) {
    classes.push(setClass);
  }
  
  // 添加number类名
  const numberClass = mapNumberToClass(props.number);
  if (numberClass) {
    classes.push(numberClass);
  }
  
  // 添加types类名（如果存在）
  if (props.types && Array.isArray(props.types)) {
    classes.push(...props.types);
  }
  
  return classes;
}

/**
 * 检查是否需要reverse-holo类名
 * @param {string} rarity - 原始的rarity值
 * @returns {boolean} 是否需要reverse-holo类名
 */
export function needsReverseHoloClass(rarity) {
  if (!rarity) return false;
  return rarity.toLowerCase().endsWith('reverse holo');
}

/**
 * 检查是否需要shiny相关类名
 * @param {string} rarity - 原始的rarity值
 * @returns {boolean} 是否需要shiny相关类名
 */
export function needsShinyClass(rarity) {
  if (!rarity) return false;
  return rarity.toLowerCase().includes('rare shiny');
}
