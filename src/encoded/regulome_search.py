from pyramid.httpexceptions import HTTPSeeOther
from pyramid.httpexceptions import HTTPTemporaryRedirect, HTTPFound
from pyramid.view import view_config
import requests

import logging
import requests
from urllib.parse import parse_qs

log = logging.getLogger(__name__)


def includeme(config):
    config.add_route('regulome-home', '/')
    config.add_route('regulome-summary', '/regulome-summary{slash:/?}')
    config.add_route('regulome-search', '/regulome-search{slash:/?}')
    config.scan(__name__)


def genomic_data_service_fetch(endpoint, query_string, page_title):
    url = "https://data-service.demo.regulomedb.org/" + endpoint + "/?" + query_string

    response_format = parse_qs(query_string).get('format', [None])
    if response_format[0] in ['bed', 'tsv']:
        raise HTTPFound(location=url)

    response = requests.get(url).json()

    response['@id'] = response['@id'].replace(endpoint, "regulome-" + endpoint).replace("&format=json", "")
    response['@type'][0] = response['@type'][0].replace(endpoint, "regulome-" + endpoint)
    response['title'] = page_title

    return response


@view_config(route_name='regulome-home', request_method='GET')
def regulome_home(context, request):
    raise HTTPTemporaryRedirect(location='/regulome-search/')


@view_config(route_name='regulome-summary', request_method=('GET', 'POST'), permission='search')
def regulome_summary(context, request):
    return genomic_data_service_fetch("summary", request.query_string, "RegulomeDB Summary")


@view_config(route_name='regulome-search', request_method='GET', permission='search')
def regulome_search(context, request):
    if len(request.params) == 0:
        # temp response for empty params until removal of snovault
        return {
            '@context': '/terms/',
            '@id': '/regulome-search',
            'assembly': 'GRCh37',
            'query_coordinates': [],
            'format': 'json',
            'from': 0,
            'total': 0,
            'variants': [],
            'notifications': {},
            '@type': ['regulome-search'],
            'title': 'RegulomeDB search'
        }

    return genomic_data_service_fetch("search", request.query_string, "RegulomeDB Search")
