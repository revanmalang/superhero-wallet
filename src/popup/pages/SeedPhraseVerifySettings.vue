<template>
  <div class="seed-phrase-settings">
    <div class="text-heading-1">
      {{ $t('pages.seed-phrase-settings.verifyYourSeedPhrase') }}
    </div>

    <div class="text-description">
      {{ $t('pages.seed-phrase-settings.confirm-that-you-save-your-seed-phrase') }}
    </div>
    <i18n
      path="pages.seed-phrase-settings.compose-your-seed-phrase"
      tag="div"
      class="text-description"
    >
      <strong>
        {{ $t('pages.seed-phrase-settings.in-correct-order') }}
      </strong>
    </i18n>

    <div class="phraser">
      <BtnPlain
        v-for="(word, index) in mnemonicShuffled"
        :key="index"
        :class="['badge', { selected: selectedWordIds.includes(index) }]"
        @click.native="onSelectWord(index)"
      >
        {{ word }}
      </BtnPlain>
    </div>

    <div class="phraser custom">
      <template v-if="!selectedWordIds.length">
        <BtnPlain class="badge selected">
          <div>{{ $t('pages.seedPhrase.first') }}</div>
          <Close class="close-icon" />
        </BtnPlain>
        <BtnPlain class="badge selected">
          <div>{{ $t('pages.seedPhrase.second') }}</div>
          <Close class="close-icon" />
        </BtnPlain>
        <BtnPlain class="badge selected">
          <div>...</div>
          <Close class="close-icon" />
        </BtnPlain>
      </template>
      <template v-else>
        <BtnPlain
          v-for="(id, index) in selectedWordIds"
          :key="id"
          class="badge"
          @click.native="selectedWordIds.splice(index, 1)"
        >
          {{ mnemonicShuffled[id] }}
          <Close class="close-icon" />
        </BtnPlain>
      </template>
    </div>

    <div class="footer">
      <BtnMain
        class="verify-button"
        :disabled="!selectedWordIds || selectedWordIds.length !== mnemonicShuffled.length"
        @click="verifyLastStep"
      >
        {{ $t('pages.seedPhrase.verify') }}
      </BtnMain>

      <div
        v-if="showNotification"
        :class="['notification', { error: hasError }]"
      >
        <div class="icon-wrapper">
          <Alert v-if="hasError" />
          <CheckCircle v-else />
        </div>
        <div class="text">
          <div v-if="hasError">
            {{ $t('pages.seed-phrase-settings.seed-phrase-incorrect') }}
          </div>
          <div v-else>
            {{ $t('pages.seed-phrase-settings.seed-phrase-correct') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { shuffle } from 'lodash-es';
import BtnMain from '../components/buttons/BtnMain.vue';
import BtnPlain from '../components/buttons/BtnPlain.vue';
import CheckCircle from '../../icons/check-circle.svg?vue-component';
import Alert from '../../icons/alert.svg?vue-component';
import Close from '../../icons/close.svg?vue-component';

export default {
  components: {
    BtnMain,
    BtnPlain,
    CheckCircle,
    Alert,
    Close,
  },
  data: () => ({
    selectedWordIds: [],
    showNotification: false,
    hasError: false,
  }),
  computed: mapState({
    mnemonic: 'mnemonic',
    mnemonicShuffled: ({ mnemonic }) => shuffle(mnemonic.split(' ')),
  }),
  watch: {
    selectedWordIds() {
      this.showNotification = false;
      this.hasError = false;
    },
  },
  methods: {
    verifyLastStep() {
      const mnemonicSelected = this.selectedWordIds
        .map((idx) => this.mnemonicShuffled[idx])
        .join(' ');
      this.showNotification = true;
      this.hasError = this.mnemonic !== mnemonicSelected;
      if (this.mnemonic === mnemonicSelected) {
        this.$store.commit('setBackedUpSeed');
      }

      setTimeout(() => {
        this.showNotification = false;
        this.$router.push({ name: 'account' });
      }, 3000);
    },
    onSelectWord(index) {
      if (!this.selectedWordIds.includes(index)) {
        this.selectedWordIds.push(index);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-settings {
  padding: 16px;

  .title {
    color: rgba(variables.$color-white, 1);
    margin-bottom: 18px;
    text-align: center;

    @extend %face-sans-18-regular;
  }

  .phraser {
    margin: 18px 0 0;
    padding: 0;

    .badge {
      @extend %face-sans-16-light;

      height: 30px;
      border: 1px solid rgba(variables.$color-white, 0.44);
      border-radius: 4px;
      padding: 4px 6px;
      margin-right: 4px;
      margin-bottom: 8px;
      color: variables.$color-white;
      background-color: variables.$color-black;
      cursor: pointer;
      letter-spacing: 0.1rem;
      line-height: 100%;
      user-select: unset;

      .close-icon {
        margin-left: 5px;
      }

      &.selected {
        opacity: 0.4;
        cursor: unset;
        background: transparent;
        border-color: variables.$color-grey-light;
        color: variables.$color-white;
      }
    }

    &.custom {
      background: rgba(variables.$color-white, 0.15);
      border: 2px solid rgba(variables.$color-white, 0.1);
      border-radius: 16px;
      padding: 12px 8px;
      min-height: 176px;

      .badge {
        background: rgba(variables.$color-black, 0.25);
        border-radius: 4px;
        border: none;
        display: inline-flex;
        align-items: center;

        .close-icon {
          color: rgba(variables.$color-white, 0.44);
          width: 24px;
          height: 24px;
        }
      }
    }
  }

  .footer {
    position: relative;

    .verify-button {
      width: 100%;
      border-radius: variables.$border-radius-interactive;
      margin-top: 30px;
    }

    .notification {
      min-height: 176px;
      border: 2px solid variables.$color-success-dark;
      border-radius: 16px;
      background: rgba(variables.$color-black, 0.85);
      position: absolute;
      bottom: 60px;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: variables.$color-success-dark;

      @extend %face-sans-16-medium;

      &.error {
        border-color: variables.$color-danger;
        color: variables.$color-danger;
      }

      .text {
        padding: 16px;
        text-align: center;
      }

      .icon-wrapper {
        width: 40px;
        height: 40px;
        background: rgba(variables.$color-black, 0.3);
        border-radius: 20px;

        .icon {
          width: 40px;
          height: 40px;
        }
      }
    }
  }
}
</style>
