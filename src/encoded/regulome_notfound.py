from pyramid.view import view_config

def includeme(config):
    config.add_view(notfound, context='pyramid.httpexceptions.HTTPNotFound')
    config.scan(__name__)

def notfound(request):
    blocks = [{
        '@id': '#block1',
        '@type': 'richtextblock',
        'body': '<br /><p>The page could not be found. Please check the URL or enter a search term like skin, ChIP-seq, or CTCF in the toolbar above.</p>'
    }]

    page= {
        '@context': '/terms/',
        '@id': '/regulome-notfound',
        'format': 'json',
        '@type': ['regulome-help'],
        'title': 'Not Found',
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
