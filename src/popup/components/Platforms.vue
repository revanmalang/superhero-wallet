<template>
  <div class="platforms">
    <div class="heading">
      <slot name="header" />
    </div>
    <div
      v-if="IS_MOBILE_DEVICE"
      class="mobile-web-icons"
    >
      <a
        :href="APP_LINK_IOS"
        target="_blank"
      >
        <img
          :class="{ grey: !IS_IOS || !IS_MOBILE_DEVICE }"
          src="../../icons/platforms/app-store-mobile.svg"
          alt="App Store"
        >
      </a>
      <a
        :href="APP_LINK_ANDROID"
        target="_blank"
      >
        <img
          :class="{ grey: IS_IOS || !IS_MOBILE_DEVICE }"
          src="../../icons/platforms/google-play-mobile.svg"
          alt="Google Play"
        >
      </a>
    </div>
    <div
      v-else
      class="web-icons"
    >
      <div
        class="extension"
      >
        <div>
          {{ $t('pages.index.platforms.browser-extension') }}
        </div>
        <div>
          <a
            :href="APP_LINK_FIREFOX"
            target="_blank"
          >
            <img
              :class="{ grey: !IS_FIREFOX || IS_MOBILE_DEVICE }"
              src="../../icons/platforms/firefox.svg"
              alt="Firefox"
            >
          </a>
          <a
            :href="APP_LINK_CHROME"
            target="_blank"
          >
            <img
              :class="{ grey: IS_FIREFOX || IS_MOBILE_DEVICE }"
              src="../../icons/platforms/chrome.svg"
              alt="Chrome"
            >
          </a>
        </div>
      </div>
      <div class="mobile-app">
        <div>
          {{ $t('pages.index.platforms.mobile-app') }}
        </div>
        <div>
          <a
            :href="APP_LINK_IOS"
            target="_blank"
          >
            <img
              :class="{ grey: !IS_IOS || !IS_MOBILE_DEVICE }"
              src="../../icons/platforms/app-store.svg"
              alt="App Store"
            >
          </a>
          <a
            :href="APP_LINK_ANDROID"
            target="_blank"
          >
            <img
              :class="{ grey: IS_IOS || !IS_MOBILE_DEVICE }"
              src="../../icons/platforms/google-play.svg"
              alt="Google Play"
            >
          </a>
        </div>
      </div>
    </div>
    <div class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
import {
  APP_LINK_CHROME,
  APP_LINK_FIREFOX,
  APP_LINK_ANDROID,
  APP_LINK_IOS,
} from '../utils/constants';
import { IS_MOBILE_DEVICE, IS_IOS, IS_FIREFOX } from '../../lib/environment';

export default {
  data: () => ({
    IS_MOBILE_DEVICE,
    IS_IOS,
    IS_FIREFOX,
    APP_LINK_CHROME,
    APP_LINK_FIREFOX,
    APP_LINK_ANDROID,
    APP_LINK_IOS,
  }),
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.platforms {
  @extend %face-sans-15-regular;

  font-size: 15px;
  background-color: var(--screen-bg-color);
  word-break: break-word;

  .heading {
    @extend %face-sans-17-regular;

    margin: 8px auto;
    width: 248px;
    padding: 4px 8px;
    color: variables.$color-white;
  }

  .footer {
    @extend %face-sans-17-regular;

    margin-top: 14px;
    margin-bottom: 12px;
  }

  .mobile-web-icons {
    @include mixins.flex(center, center);

    gap: 17px;
  }

  .web-icons {
    @include mixins.flex(center, center);

    text-align: center;
    color: variables.$color-grey-light;

    .extension {
      width: 50%;
      border-right: 1px solid variables.$color-border-hover;
    }

    .mobile-app {
      flex-grow: 1;
    }

    .mobile-app,
    .extension {
      div {
        @include mixins.flex(center);

        + div {
          padding-top: 15px;
          padding-bottom: 12px;
        }

        a {
          &:first-of-type {
            margin-right: 32px;
          }

          img {
            height: 40px;
            width: 40px;

            &.grey {
              filter: grayscale(1);
              opacity: 0.8;

              &:hover {
                filter: none;
                opacity: 1;
              }
            }
          }
        }
      }
    }
  }
}
</style>
