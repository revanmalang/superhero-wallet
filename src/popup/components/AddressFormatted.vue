<template>
  <div class="address-formatted">
    <template v-if="isAddress">
      <span
        v-for="(chunk, index) in addressChunks"
        :key="index"
        class="address-formatted-chunk"
        :class="{ 'align-right': alignRight }"
        :style="cssVariable"
      >{{ chunk }}</span>
    </template>
    <span v-else>{{ address }}</span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';

import { checkAddress } from '../utils';

export default defineComponent({
  props: {
    address: { type: String, required: true },
    columnCount: { type: Number, default: 6 },
    alignRight: Boolean,
  },
  setup(props) {
    const prepareChunk = (chunk: any) => {
      const maxLength = 3;
      return chunk.length === maxLength ? chunk : `${chunk}${' '.repeat(maxLength - chunk.length)}`;
    };

    const isAddress = computed(() => checkAddress(props.address));
    const addressChunks = computed(() => props.address.match(/.{1,3}/g)?.map(prepareChunk));
    const cssVariable = computed(() => ({
      '--column-width': `${100 / props.columnCount}%`,
    }));

    return {
      prepareChunk,
      isAddress,
      addressChunks,
      cssVariable,
    };
  },
});
</script>

<style lang="scss" scoped>
.address-formatted {
  display: inline-flex;
  flex-wrap: wrap;
  letter-spacing: 0.15em;

  &-chunk {
    flex: 0 0 var(--column-width);

    &.align-right {
      text-align: right;
      white-space: break-spaces;
    }
  }
}
</style>
