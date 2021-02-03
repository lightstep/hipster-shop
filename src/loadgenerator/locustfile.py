#!/usr/bin/python
#
# Copyright 2018 Google LLC
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

import random
from locust import HttpLocust, TaskSet

products = [
    '0PUK6V6EV0',
    '1YMWWN1N4O',
    '66VCHSJNUP',
    '6E92ZMYYFZ',
    'L9ECAV7KIM',
    'LS4PSXUNUM',
    'OLJCESPC7Z',
    '3R92ZDDYKL',
    '3R92ZMYYKL'
]

counter = 0

def index(l):
    l.client.get("/")


def setCurrency(l):
    currencies = ["EUR", "USD", "JPY", "CAD"]
    l.client.post("/setCurrency", {"currency_code": random.choice(currencies)})


def browseProduct(l):
    l.client.get("/product/" + random.choice(products))


def viewCart(l):
    l.client.get("/cart")


def addToCart(l):
    product = random.choice(products)
    l.client.get("/product/" + product)
    l.client.post(
        "/cart", {"product_id": product, "quantity": random.choice([1, 2, 3, 4, 5, 10])}
    )


def checkout(l):
    global counter
    route = "/cart/checkout"
    visaCC = {
                "email": "someone@example.com",
                "street_address": "1600 Amphitheatre Parkway",
                "zip_code": "94043",
                "city": "Mountain View",
                "state": "CA",
                "country": "United States",
                "credit_card_number": "4432-8015-6152-0454",
                "credit_card_expiration_month": "1",
                "credit_card_expiration_year": "2039",
                "credit_card_cvv": "672",
             }
    mcCC = {
                "email": "someone@example.com",
                "street_address": "1600 Amphitheatre Parkway",
                "zip_code": "94043",
                "city": "Mountain View",
                "state": "CA",
                "country": "United States",
                "credit_card_number": "5328897010174228",
                "credit_card_expiration_month": "1",
                "credit_card_expiration_year": "2039",
                "credit_card_cvv": "123",
        
    }
    badCC = {
                "email": "amex@example.com",
                "street_address": "1600 Amphitheatre Parkway",
                "zip_code": "94043",
                "city": "Mountain View",
                "state": "CA",
                "country": "United States",
                "credit_card_number": "347572753801901",
                "credit_card_expiration_month": "1",
                "credit_card_expiration_year": "2026",
                "credit_card_cvv": "528",
             }
    goodCards = [visaCC, mcCC, visaCC, mcCC, visaCC, mcCC, badCC, badCC]
    goodWithBadCards = [visaCC, mcCC, badCC, badCC, badCC, badCC, badCC]
    
    addToCart(l)

    if (counter <= 200):
        l.client.post(route, random.choice(goodCards))
    else:
        l.client.post(route, random.choice(goodWithBadCards))
    counter += 1
    if counter >= 300:
        counter = 0

class UserBehavior(TaskSet):
    def on_start(self):
        index(self)

    tasks = {
        index: 5,
        browseProduct: 5,
        addToCart: 1,
        viewCart: 1,
        checkout: 2,
    }


class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 1000
    max_wait = 10000
