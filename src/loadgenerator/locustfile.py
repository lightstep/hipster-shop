#!/usr/bin/python
#
# Copyright 2021 Lightstep
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from data import random_currency, random_card, random_product, random_quantity
from locust import HttpUser, LoadTestShape, task, between
import random
import datetime


class Hipster(HttpUser):
    wait_time = between(1, 10)

    def on_start(self):
        self.index()
    
    @task(50)
    def index(self):
        self.client.get('/')

    @task(50)
    def browse_product(self):
        self.client.get("/product/" + random_product())

    @task(10)
    def add_to_cart(self):
        product = random_product()
        self.client.get("/product/" + product)
        self.client.post(
            "/cart", {"product_id": product, "quantity": random_quantity()}
        )

    @task(10)
    def view_cart(self):
        self.client.get("/cart")

    @task(20)
    def checkout(self):
        self.add_to_cart()
        self.client.post("/cart/checkout", random_card(bad=random.random() < 0.01))

    @task(1)
    def set_currency(self):
        self.client.post("/setCurrency", {"currency_code": random_currency()})


class HourlyWave(LoadTestShape):
    fast_low_end = 10
    fast_high_end = 30

    slow_low_end = 0
    slow_high_end = 50

    def tick(self):
        now = datetime.datetime.now()
        fast_factor = (now.minute / 60) ** 2
        fast_total = self.fast_low_end + (self.fast_high_end - self.fast_low_end) * fast_factor
        slow_factor = ((now.minute + (now.hour % 4) * 60) / 240) ** 3
        slow_total = self.slow_low_end + (self.slow_high_end - self.slow_low_end) * slow_factor
        return fast_total + slow_total, 1
