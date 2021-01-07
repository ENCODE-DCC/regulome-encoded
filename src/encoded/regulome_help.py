from pyramid.view import view_config

def includeme(config):
    config.add_route('regulome-help', '/regulome-help/')
    config.scan(__name__)


@view_config(route_name='regulome-help', request_method='GET')
def regulome_help(context, request):
    static_help_page_path = './src/encoded/static/help.html'

    blocks = [{
        '@id': '#block1',
        'blocktype': {'label': 'main'},
        '@type': 'richtextblock',
        'body': open(static_help_page_path, 'r').read()
    }]

    page= {
        '@context': '/terms/',
        '@id': '/regulome-search',
        'assembly': 'GRCh37',
        'query_coordinates': [],
        'format': 'json',
        'notifications': {},
        '@type': ['regulome-help'],
        'title': 'Help',
        'layout': {
            'blocks': blocks,
            'rows': [{
                'cols': [{
                    'blocks': ['#block1']
                }]
            }]
        }
    }

    return page
