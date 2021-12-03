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
import random

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

currencies = ["EUR", "USD", "JPY", "CAD", "TRY"]

good_cards = [{
    "email": "someone@example.com",
    "street_address": "101 Green Street",
    "zip_code": "94111",
    "city": "San Francisco",
    "state": "CA",
    "country": "United States",
    "credit_card_number": "4529-8148-3975-2894",
    "credit_card_expiration_month": "7",
    "credit_card_expiration_year": "2031",
    "credit_card_cvv": "409",
}, {
    "email": "someoneelse@example.com",
    "street_address": "4400 Carillon Point, Floor 4",
    "zip_code": "98033",
    "city": "Kirkland",
    "state": "WA",
    "country": "United States",
    "credit_card_number": "5379759871429836",
    "credit_card_expiration_month": "1",
    "credit_card_expiration_year": "2032",
    "credit_card_cvv": "665",
}]
bad_cards = [{
    "email": "validbutamex@example.com",
    "street_address": "60 East 42nd Street, Suite 1230",
    "zip_code": "10165",
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "credit_card_number": "347572753801901",
    "credit_card_expiration_month": "1",
    "credit_card_expiration_year": "2026",
    "credit_card_cvv": "528",
}]


def random_card(bad=False):
    return random.choice(bad_cards if bad else good_cards)


def random_currency():
    return random.choice(currencies)


def random_product():
    return random.choice(products)


def random_quantity():
    return random.choice([1, 2, 3, 4, 5, 10])
