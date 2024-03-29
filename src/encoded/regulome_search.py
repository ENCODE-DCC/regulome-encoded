from pyramid.httpexceptions import HTTPSeeOther, HTTPFound
from pyramid.httpexceptions import HTTPTemporaryRedirect
from pyramid.view import view_config
import requests

import logging
import requests
from urllib.parse import parse_qs
from pyramid.response import Response

log = logging.getLogger(__name__)


def includeme(config):
    config.add_route('regulome-home', '/')
    config.add_route('regulome-summary', '/regulome-summary{slash:/?}')
    config.add_route('regulome-search', '/regulome-search{slash:/?}')
    config.add_route('file-download', '/files/{accession}/@@download/{file_url:.*}')
    config.scan(__name__)


def genomic_data_service_fetch(endpoint,  request, page_title):
    data_service_url = request.registry.settings['genomic_data_service_url']

    query_string = request.query_string.split('/')[0]

    url = data_service_url + "/" + endpoint + "/?" + query_string

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


@view_config(route_name='regulome-summary', request_method=('GET', 'POST'))
def regulome_summary(context, request):
    response = genomic_data_service_fetch("summary", request, "RegulomeDB Summary")

    if response['total'] == 1:
        query = {
            'regions': response['query_coordinates'],
            'genome': response['assembly']
        }
        raise HTTPSeeOther(location=request.route_url('regulome-search', slash='', _query=query))

    return response


@view_config(route_name='regulome-search', request_method='GET')
def regulome_search(context, request):
    if len(request.params) == 0:
        return {
            '@context': '/terms/',
            '@id': '/regulome-search',
            'assembly': 'GRCh38',
            'query_coordinates': [],
            'format': 'json',
            'from': 0,
            'total': 0,
            'variants': [],
            'notifications': {},
            '@type': ['regulome-search'],
            'title': 'RegulomeDB Search'
        }

    return genomic_data_service_fetch("search", request, "RegulomeDB Search")


@view_config(route_name='file-download', request_method='GET')
def encode_download(context, request):
    raise HTTPTemporaryRedirect(location='https://www.encodeproject.org' + request.path_qs)
