<template>
  <div
    class="weather-widget"
    :class="computedContainerClass"
    :style="computedContainerStyle"
  >
    <div
      v-if="isLoading"
      class="loading-indicator"
    >
      <span class="loading-text">获取天气数据中...</span>
    </div>

    <template v-else>
      <div class="weather-left">
        <div
          v-if="showOptions.city"
          class="weather-city"
          :style="cityStyle"
        >
          <span
            v-if="showOptions.province && weatherData.province"
            class="province-name"
          >{{ weatherData.province }}</span>
          {{ formatCity(weatherData.city) }}
        </div>

        <div
          v-if="showOptions.currentTemp"
          class="weather-current"
          :style="currentTempStyle"
        >
          <span class="current-temp">{{ weatherData.currentTemp }}℃</span>
        </div>
      </div>

      <div class="weather-right">
        <div
          v-if="showOptions.weather"
          class="weather-desc-only"
          :style="secondaryTextStyle"
        >
          {{ formatWeatherDesc(weatherData.weather) }}
        </div>

        <div
          v-if="showOptions.todayTemp"
          class="weather-today"
          :style="secondaryTextStyle"
        >
          <span class="temp-range">{{ weatherData.minTemp }} - {{ weatherData.maxTemp }}℃</span>
        </div>

        <div
          v-if="showOptions.updateTime && weatherData.reporttime"
          class="update-time"
          :style="secondaryTextStyle"
        >
          更新时间: {{ formatTime(weatherData.reporttime) }}
        </div>
      </div>
    </template>

    <div
      v-if="hasError"
      class="error-message"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { pathConfigMap } from "@/common/envList.js";

export default {
  name: "WeatherWidget",
  props: {
    pageItem: {
      type: Object,
      default: () => ({})
    },
    displayOptions: {
      type: Object,
      default: () => ({
        city: true,
        currentTemp: true,
        todayTemp: true,
        weather: true,
        updateTime: false,
        province: false
      })
    },
    weatherInfo: {
      type: Object,
      default: () => ({})
    },
    amapKey: {
      type: String,
      default: () => {
        const pathConfig =
          (pathConfigMap && window.env && pathConfigMap[window.env]) || {};
        if (pathConfig && pathConfig.amapKey) {
          return pathConfig.amapKey;
        }
        return "96f176f14e3eb276049d4abc28d39c61";
      }
    },
    autoFetch: {
      type: Boolean,
      default: true
    },
    updateInterval: {
      type: Number,
      default: 30
    },
    containerStyle: {
      type: [Object, String],
      default: () => ({})
    },
    containerClass: {
      type: [String, Array, Object],
      default: ""
    }
  },
  data() {
    return {
      defaultWeatherData: {
        city: "延安",
        currentTemp: 28,
        minTemp: 25,
        maxTemp: 32,
        weather: "多云",
        winddirection: "北风",
        windpower: "≤3",
        reporttime: ""
      },
      realTimeWeatherData: {},
      forecastWeatherData: {},
      locationInfo: {},
      isLoading: false,
      hasError: false,
      errorMessage: "",
      updateTimer: null
    };
  },
  computed: {
    showOptions() {
      return {
        ...this.displayOptions,
        ...this.pageItem?.widget_json?.displayOptions
      };
    },
    weatherData() {
      const baseData = {
        ...this.defaultWeatherData,
        ...this.weatherInfo,
        ...this.pageItem?.widget_json?.weatherData
      };

      if (
        this.realTimeWeatherData &&
        Object.keys(this.realTimeWeatherData).length > 0
      ) {
        const liveData = this.realTimeWeatherData.lives?.[0] || {};
        const forecastData =
          this.forecastWeatherData.forecasts?.[0]?.casts?.[0] || {};

        return {
          ...baseData,
          city: liveData.city || this.locationInfo.city || baseData.city,
          province: this.locationInfo.province || baseData.province,
          currentTemp: liveData.temperature || baseData.currentTemp,
          weather: liveData.weather || baseData.weather,
          winddirection: liveData.winddirection || baseData.winddirection,
          windpower: liveData.windpower || baseData.windpower,
          reporttime: liveData.reporttime || baseData.reporttime,
          minTemp: forecastData.nighttemp || baseData.minTemp,
          maxTemp: forecastData.daytemp || baseData.maxTemp
        };
      }

      return baseData;
    },
    computedContainerStyle() {
      const baseStyle = {
        display: "flex"
      };

      if (typeof this.containerStyle === "string") {
        return { ...baseStyle, cssText: this.containerStyle };
      }

      const style = { ...(this.containerStyle || {}) };
      delete style.fontSize;
      delete style["font-size"];

      return { ...baseStyle, ...style };
    },
    baseFontSize() {
      if (typeof this.containerStyle === "string") {
        return "14px";
      }

      return (
        this.containerStyle?.fontSize ||
        this.containerStyle?.["font-size"] ||
        "14px"
      );
    },
    cityStyle() {
      return {
        fontSize: this.baseFontSize
      };
    },
    currentTempStyle() {
      return {
        fontSize: `calc(${this.baseFontSize} * 1.1)`,
        lineHeight: 1
      };
    },
    secondaryTextStyle() {
      return {
        fontSize: `calc(${this.baseFontSize} * 0.8)`
      };
    },
    computedContainerClass() {
      const classes = ["weather-widget"];

      if (this.isLoading) {
        classes.push("loading");
      }

      if (this.containerClass) {
        if (Array.isArray(this.containerClass)) {
          classes.push(...this.containerClass);
        } else if (typeof this.containerClass === "object") {
          Object.keys(this.containerClass).forEach((key) => {
            if (this.containerClass[key]) {
              classes.push(key);
            }
          });
        } else {
          classes.push(this.containerClass);
        }
      }

      return classes;
    }
  },
  mounted() {
    if (this.autoFetch) {
      this.initWeatherData();
      this.startAutoUpdate();
    }
  },
  beforeUnmount() {
    this.stopAutoUpdate();
  },
  methods: {
    formatCity(city) {
      if (!city) return "";
      if (city.includes("市")) {
        return city.replace("市", "");
      }
      return city;
    },
    async initWeatherData() {
      try {
        this.isLoading = true;
        this.hasError = false;

        await this.getLocationInfo();
        await Promise.all([
          this.fetchRealTimeWeather(),
          this.fetchForecastWeather()
        ]);
      } catch (error) {
        console.error("初始化天气数据失败:", error);
        this.handleError("获取天气数据失败，请稍后重试");
      } finally {
        this.isLoading = false;
      }
    },
    async getLocationInfo() {
      try {
        const response = await fetch(
          `https://restapi.amap.com/v3/ip?key=${this.amapKey}`
        );
        const data = await response.json();

        if (data.status === "1") {
          this.locationInfo = {
            province: data.province,
            city: data.city,
            adcode: data.adcode
          };
        } else {
          throw new Error(`获取位置信息失败: ${data.info}`);
        }
      } catch (error) {
        console.error("获取位置信息失败:", error);
        this.locationInfo = {
          city: "延安",
          adcode: "610600"
        };
      }
    },
    async fetchRealTimeWeather() {
      try {
        const adcode = this.locationInfo.adcode || "610600";
        const response = await fetch(
          `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.amapKey}&city=${adcode}&extensions=base`
        );
        const data = await response.json();

        if (data.status === "1" && data.lives && data.lives.length > 0) {
          this.realTimeWeatherData = data;
        } else {
          throw new Error(`获取实时天气失败: ${data.info}`);
        }
      } catch (error) {
        console.error("获取实时天气数据失败:", error);
        throw error;
      }
    },
    async fetchForecastWeather() {
      try {
        const adcode = this.locationInfo.adcode || "610600";
        const response = await fetch(
          `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.amapKey}&city=${adcode}&extensions=all`
        );
        const data = await response.json();

        if (data.status === "1" && data.forecasts && data.forecasts.length > 0) {
          this.forecastWeatherData = data;
        } else {
          console.warn("获取天气预报失败:", data.info);
        }
      } catch (error) {
        console.error("获取天气预报数据失败:", error);
      }
    },
    formatWeatherDesc(weather) {
      return weather || "";
    },
    formatTime(timeStr) {
      if (!timeStr) return "";

      try {
        const date = new Date(timeStr);
        return date.toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (error) {
        return timeStr;
      }
    },
    handleError(message) {
      this.hasError = true;
      this.errorMessage = message;

      setTimeout(() => {
        this.hasError = false;
      }, 3000);
    },
    startAutoUpdate() {
      if (this.updateInterval > 0) {
        this.updateTimer = setInterval(() => {
          this.initWeatherData();
        }, this.updateInterval * 60 * 1000);
      }
    },
    stopAutoUpdate() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.weather-widget {
  display: flex;
  gap: 20px;
  align-items: center;
}

.weather-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.weather-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
