import Vue from 'vue'
import VueRx from 'vue-rx'
import App from './App.vue'
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import sanitizeHtml from 'sanitize-html';
Vue.prototype.$sanitize = sanitizeHtml;

Vue.use(VueQuillEditor, /* { default global options } */);
Vue.use(VueRx);
Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
