<template>
  <div class="auction">
    <div class="auction-tabs">
      <Tabs>
        <Tab
          :to="{ name: 'auction-bid' }"
          :text="$t('pages.names.auctions.place-bid')"
          exact-path
        />
        <Tab
          :to="{ name: 'auction-history' }"
          :text="$t('pages.names.auctions.bid-history')"
        />
      </Tabs>
    </div>

    <Loader v-if="loading" />

    <RouterView v-else />
  </div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { aettosToAe, watchUntilTruthy } from '../../utils/helper';
import Tabs from '../../components/tabs/Tabs.vue';
import Tab from '../../components/tabs/Tab.vue';

export default {
  name: 'Auction',
  components: {
    Tabs,
    Tab,
  },
  props: {
    name: { type: String, required: true },
  },
  data: () => ({ loading: true }),
  mounted() {
    const id = setInterval(() => this.updateAuctionEntry(), 3000);
    this.$once('hook:destroyed', () => clearInterval(id));
    this.$watch(
      ({ name }) => name,
      () => {
        this.loading = true;
        this.updateAuctionEntry();
      },
      { immediate: true },
    );
  },
  methods: {
    async updateAuctionEntry() {
      await watchUntilTruthy(() => this.$store.state.middleware);
      try {
        const res = await this.$store.state.middleware.getNameById(this.name);
        // TODO: remove after resolving https://github.com/aeternity/ae_mdw/issues/509
        const { auctionEnd, bids } = res.auction ?? res.info;
        const loadedBids = await Promise.all(bids.map(async (txId) => {
          const { tx } = await this.$store.state.middleware.getTxByIndex(txId);
          return {
            nameFee: new BigNumber(aettosToAe(tx.nameFee)),
            accountId: tx.accountId,
          };
        }));
        this.$store.commit('names/setAuctionEntry', {
          name: this.name,
          expiration: auctionEnd,
          bids: loadedBids,
        });
      } catch (error) {
        this.$router.push('/names/auctions');
      }
      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.auction {
  &-tabs {
    padding-inline: var(--screen-padding-x);
  }
}
</style>
