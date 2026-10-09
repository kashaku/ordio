<script>
import { initializeRepository } from './services/repository'

export default {
  onLaunch() {
    initializeRepository().catch((error) => {
      console.error('初始化本地数据失败', error)
    })
  },
}
</script>

<style>
page {
  min-height: 100%;
  color: #171717;
  background: #faf7f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 28rpx;
}

view,
text,
button,
input,
textarea,
image,
scroll-view {
  box-sizing: border-box;
}

button {
  margin: 0;
  border-radius: 14rpx;
  font-size: 28rpx;
  line-height: 1.2;
}

button::after {
  border: 0;
}

.page {
  min-height: 100vh;
  padding: 28rpx;
}

.card {
  border: 1rpx solid #e8e1d5;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(45, 35, 20, 0.05);
}

.primary-button {
  color: #171717;
  background: #f5b000;
  font-weight: 700;
}

.secondary-button {
  color: #171717;
  background: #f2eee6;
}

.danger-button {
  color: #fff;
  background: #b85c38;
}

.success-text {
  color: #2f7d57;
}

.muted {
  color: #746f67;
}

.empty-state {
  padding: 80rpx 32rpx;
  color: #746f67;
  text-align: center;
}
</style>
