import React from 'react';
import PropTypes from 'prop-types';
import * as globals from '../globals';

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    console.log("using the polyfill");
    Element.prototype.closest = function(s) {
        let el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

export default class RichTextBlockView extends React.Component {
    constructor(props) {
        super(props);

        // Set initial React component state.
        this.state = {
            value: this.props.value,
        };

        // Bind this to non-React components.
        this.setupEditor = this.setupEditor.bind(this);
        this.handleClickableFAQ = this.handleClickableFAQ.bind(this);
    }

    componentDidMount() {
        const $script = require('scriptjs');
        if (this.context.editable) {
            $script('ckeditor/ckeditor', this.setupEditor);
        }
        this.handleClickableFAQ();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ value: nextProps.value });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (!this.editor || nextState.value.body !== this.editor.getData());
    }

    setupEditor() {
        const ck = require('ckeditor');
        ck.disableAutoInline = true;
        this.editor = ck.inline(this.domNode, {
            language: 'en',
            toolbar: [
                { name: 'basicstyles', groups: ['basicstyles', 'cleanup'], items: ['Bold', 'Italic', 'Underline', 'Strike', '-', 'RemoveFormat'] },
                { name: 'styles', items: ['Format'] },
                { name: 'paragraph', groups: ['list', 'indent', 'align'], items: ['NumberedList', 'BulletedList'] },
                { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
                { name: 'undo', groups: ['undo'], items: ['Undo', 'Redo'] },
                { name: 'document', groups: ['mode'], items: ['Source'] },
            ],
            format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;code;cite',
            format_code: { name: 'Inline Code', element: 'code' },
            format_cite: { name: 'Citation', element: 'cite' },
            allowedContent: true,
        });
        this.editor.on('change', () => {
            this.state.value.body = this.editor.getData();
            this.setState(this.state);
            this.props.onChange(this.state.value);
        });
    }

    // Clickable FAQs: hide and show answers corresponding to questions
    handleClickableFAQ() {
        if (this.state.value.body.includes('faq')) {
            const faqContainer = document.getElementsByClassName('faq')[0];
            // One event listener on the 'faq' container handles all click events
            faqContainer.addEventListener('click', (e) => {
                // Determine which question the user clicked on
                const target = e.target.closest('.regulomehelp-question');
                if (target) {
                    // Toggle whether corresponding answer is displayed or hidden
                    const infoId = target.id.split('regulomehelp-faq')[1].split('-question')[0];
                    const infoElement = document.getElementById(`regulomehelp-faq${infoId}-answer`);
                    infoElement.classList.toggle('show');
                    // Toggle direction caret is pointing
                    const iconElement = target.getElementsByTagName('i')[0];
                    if (iconElement.className.indexOf('icon-caret-right') > -1) {
                        iconElement.classList.add('icon-caret-down');
                        iconElement.classList.remove('icon-caret-right');
                    } else {
                        iconElement.classList.remove('icon-caret-down');
                        iconElement.classList.add('icon-caret-right');
                    }
                }
            });
        }
    }

    render() {
        return (
            <div contentEditable={this.context.editable} dangerouslySetInnerHTML={{ __html: this.state.value.body }} ref={(comp) => { this.domNode = comp; }} />
        );
    }
}

RichTextBlockView.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.object,
};

RichTextBlockView.defaultProps = {
    value: null,
};

RichTextBlockView.contextTypes = {
    editable: PropTypes.bool,
};


globals.blocks.register({
    label: 'rich text block',
    icon: 'icon icon-file-text',
    schema: {
        type: 'object',
        properties: {
            body: {
                title: 'HTML Source',
                type: 'string',
                formInput: <textarea rows="10" />,
            },
            className: {
                title: 'CSS Class',
                type: 'string',
            },
        },
    },
    view: RichTextBlockView,
    initial: {
        body: '<p>This is a new block.</p>',
    },
}, 'richtextblock');
