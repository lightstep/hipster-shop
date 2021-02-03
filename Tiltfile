load('ext://secret', 'secret_create_generic')

k8s_yaml([
  'kubernetes-manifests/otel-collector.yaml',
  'kubernetes-manifests/adservice.yaml',
  'kubernetes-manifests/cartservice.yaml',
  'kubernetes-manifests/checkoutservice.yaml',
  'kubernetes-manifests/currencyservice.yaml',
  'kubernetes-manifests/emailservice.yaml',
  'kubernetes-manifests/wsl2/frontend.yaml',
  'kubernetes-manifests/k8s-service-account.yaml',
  'kubernetes-manifests/lightstep-configmap.yaml',
  'kubernetes-manifests/loadgenerator.yaml',
  'kubernetes-manifests/otel-collector-config.yaml',
  'kubernetes-manifests/paymentservice.yaml',
  'kubernetes-manifests/productcatalogservice.yaml',
  'kubernetes-manifests/recommendationservice.yaml',
  'kubernetes-manifests/redis.yaml',
  'kubernetes-manifests/shippingservice.yaml',
])

secret_create_generic('lightstep-credentials', from_file='accessToken=./.ls_key')

docker_build('adservice', 'src/adservice')
docker_build('emailservice', 'src/emailservice')
docker_build('productcatalogservice', 'src/productcatalogservice')
docker_build('recommendationservice', 'src/recommendationservice')
docker_build('shippingservice', 'src/shippingservice')
docker_build('checkoutservice', 'src/checkoutservice')
docker_build('paymentservice', 'src/paymentservice')
docker_build('currencyservice', 'src/currencyservice')
docker_build('cartservice', 'src/cartservice')
docker_build('frontend', 'src/frontend')
docker_build('loadgenerator', 'src/loadgenerator')