<template>
  <Modal
    class="transfer-send-modal"
    has-close-button
    from-bottom
    @close="closeModal"
  >
    <div class="relative">
      <transition name="fade-between">
        <component
          :is="currentStepConfig.component"
          ref="currentRenderedComponent"
          v-model="transferData"
          :is-address-chain="isAddressChain"
          :is-address-url="isAddressUrl"
          @success="currentStepConfig.onSuccess"
          @error="(val) => error = val"
        />
      </transition>
    </div>

    <template #footer>
      <BtnMain
        v-if="showEditButton"
        variant="secondary"
        text="Edit"
        class="button-action-secondary"
        @click="editTransfer"
      />
      <BtnMain
        class="button-action-primary"
        :disabled="error || !isConnected || !transferData.address || !transferData.amount"
        :has-icon="showSendButton"
        :text="showSendButton ? $t('pages.send.send') : $t('modals.send.next')"
        @click="proceedToNextStep"
      >
        {{ showSendButton ? $t('pages.send.send') : $t('modals.send.next') }}
        <ArrowSendIcon v-if="showSendButton" />
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { MODAL_TRANSFER_SEND } from '../../utils/constants';
import { validateTipUrl } from '../../utils/helper';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TransferSendForm from '../TransferSendForm.vue';
import TransferReview from '../TransferReview.vue';
import TransferReviewTip from '../TransferReviewTip.vue';
import ArrowSendIcon from '../../../icons/arrow-send.svg?vue-component';

const STEP_FORM = 'form';
const STEP_REVIEW = 'review';
const STEP_REVIEW_TIP = 'tip';

export default {
  name: 'TransferSend',
  components: {
    Modal,
    BtnMain,
    ArrowSendIcon,
  },
  props: {
    tokenContractId: { type: String, default: null },
    address: { type: String, default: null },
  },
  data() {
    return {
      STEP_FORM,
      STEP_REVIEW,
      STEP_REVIEW_TIP,
      currentStep: STEP_FORM,
      error: false,
      transferData: {
        address: '',
        amount: null,
        selectedAsset: null,
      },
      steps: {
        [STEP_FORM]: {
          component: TransferSendForm,
          onSuccess: this.handleSendFormSuccess,
        },
        [STEP_REVIEW_TIP]: {
          component: TransferReviewTip,
          onSuccess: this.handleReviewTipSuccess,
        },
        [STEP_REVIEW]: {
          component: TransferReview,
          onSuccess: this.handleReviewSuccess,
        },
      },
    };
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['isConnected']),
    currentStepConfig() {
      return this.steps[this.currentStep];
    },
    showEditButton() {
      return [STEP_REVIEW_TIP, STEP_REVIEW].includes(this.currentStep);
    },
    showSendButton() {
      return this.currentStep === STEP_REVIEW;
    },
    isAddressChain() {
      return this.transferData.address.endsWith('.chain');
    },
    isAddressUrl() {
      return !this.isAddressChain && validateTipUrl(this.transferData.address);
    },
  },
  created() {
    if (this.tokenContractId && this.availableTokens[this.tokenContractId]) {
      this.transferData.selectedAsset = this.availableTokens[this.tokenContractId];
    }
    if (this.address) this.transferData.address = this.address;
  },
  methods: {
    closeModal() {
      this.$store.commit('modals/closeByKey', MODAL_TRANSFER_SEND);
    },
    proceedToNextStep() {
      this.$refs.currentRenderedComponent.submit();
    },
    handleSendFormSuccess(data) {
      this.transferData = data;
      this.currentStep = (this.isAddressUrl)
        ? STEP_REVIEW_TIP
        : STEP_REVIEW;
    },
    handleReviewTipSuccess() {
      this.currentStep = STEP_REVIEW;
    },
    /**
     * Review success means that the transfer has been initiated
     * and the summary modal will be displayed by the `pendingTransactionHandler`
     * after the transfer is finished.
     */
    handleReviewSuccess() {
      this.closeModal();
    },
    editTransfer() {
      this.error = false;
      this.currentStep = STEP_FORM;
    },
  },
};
</script>

<style lang="scss" scoped>
.transfer-send-modal {
  .button-action-secondary {
    flex-basis: 30%;
  }

  .button-action-primary {
    flex-basis: 70%;
  }
}
</style>
