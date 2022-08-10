import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { svgIcon } from '../libs/svg-icons';
import HumanBodyDiagram from '../img/bodyMap/Deselected_Body';
import { initializedChromatinObjectHg19, initializedChromatinObjectGRCh38 } from './chromatin_view';

const sanitizedString = globals.sanitizedString;
const classString = globals.classString;

// Mapping from organ slims to paths and shapes on the body map SVG
// Note: there is some complexity here because some organ slims are overlapping, or subsets of each other, or synonymous
// For example, "intestine" highlights both "large intestine" and "small intestine"
//     The mapping lists the organs which are a subset of "intestine" which the code uses as references to look up the paths
// As another type of example, note that "skeleton" highlights "bone element" but not the other way around
// A third case is "esophagus" and "trachea": they each highlight the same paths but are not the same organ
//     Because of the way the code works, we need to include both the paths and the synonymous term for each
export const HumanList = {
    'adrenal gland': ['cls-34'],
    'arterial blood vessel': ['cls-11'],
    'bone element': ['cls-65', 'cls-77', 'cls-78', 'cls-80', 'cls-81'],
    brain: ['cls-6', 'cls-68', 'cls-69', 'cls-70'],
    breast: ['cls-breast', 'cls-97', 'cls-98', 'cls-99', 'cls-100', 'cls-101', 'mammary gland'],
    bronchus: ['cls-25'],
    colon: ['large intestine'],
    // Currently there are no organ slims for epiglottis, nor are any planned
    // However, the artist did include a shape for it, so we may want to add it back at some time
    // epiglottis: ['cls-epiglottis'],
    esophagus: ['trachea', 'cls-37', 'cls-38'],
    eye: ['cls-4', 'cls-71', 'cls-73', 'cls-74', 'cls-75'],
    gallbladder: ['cls-gallbladder'],
    gonad: ['testis', 'ovary'],
    heart: ['cls-33', 'cls-44', 'cls-45'],
    intestine: ['large intestine', 'small intestine', 'colon'],
    kidney: ['cls-kidney'],
    'large intestine': ['cls-29', 'cls-30', 'cls-lg-intestine', 'colon'],
    limb: ['cls-limb'],
    liver: ['cls-31', 'cls-32'],
    lung: ['bronchus', 'cls-24'],
    'mammary gland': ['cls-98'],
    mouth: ['cls-8'],
    'musculature of body': ['cls-83', 'cls-84', 'cls-85', 'cls-88', 'cls-89', 'cls-90', 'cls-91'],
    nerve: ['cls-21', 'cls-nervebackground'],
    nose: ['cls-nose'],
    ovary: ['cls-ovary'],
    pancreas: ['cls-23'],
    penis: ['cls-62'],
    pericardium: ['cls-46', 'cls-48'],
    'prostate gland': ['cls-54'],
    skeleton: ['cls-65', 'cls-77', 'cls-78', 'cls-80', 'cls-81', 'bone element'],
    'skin of body': ['cls-5', 'cls-limb-skin'],
    'small intestine': ['cls-27', 'cls-28'],
    'spinal cord': ['cls-66'],
    spleen: ['cls-7'],
    stomach: ['cls-stomach'],
    testis: ['cls-testis'],
    thymus: ['cls-39', 'cls-41'],
    'thyroid gland': ['cls-thymus', 'cls-40'],
    trachea: ['esophagus', 'cls-37', 'cls-38'],
    tongue: ['cls-95'],
    ureter: ['cls-57'],
    uterus: ['cls-uterus'],
    'urinary bladder': ['cls-35', 'cls-36'],
    vagina: ['cls-vagina', 'cls-vagina2'],
    vein: ['cls-vein'],
};

// Mapping from cells and tissue types to inset images
// All mappings are empty because there are no paths or shapes that correspond to the inset images
//     (each has one associated image with a name corresponding to the cell or tissue term)
export const HumanCellsList = {
    'adipose tissue': [],
    blood: [],
    'blood vessel': [],
    'bone marrow': [],
    'connective tissue': [],
    embryo: [],
    epithelium: [],
    'lymphoid tissue': [],
    'lymph node': [],
    'lymphatic vessel': [],
    placenta: [],
};

// Mapping for systems slims
// Systems slims are mapped to organs in the "BodyList"
export const HumanSystemsList = {
    'central nervous system': ['brain', 'spinal cord'],
    'circulatory system': ['blood', 'blood vessel', 'arterial blood vessel', 'heart', 'pericardium', 'vein', 'lymphatic vessel'],
    'digestive system': ['esophagus', 'intestine', 'small intestine', 'large intestine', 'liver', 'gallbladder', 'mouth', 'spleen', 'stomach', 'tongue', 'colon'],
    'endocrine system': ['adrenal gland', 'liver', 'gallbladder', 'pancreas', 'thymus', 'thyroid gland'],
    'excretory system': ['urinary bladder', 'kidney', 'ureter'],
    'exocrine system': ['mammary gland', 'liver'],
    'immune system': ['lymphoid tissue', 'spleen', 'thymus', 'bone marrow', 'lymph node', 'lymphatic vessel'],
    musculature: ['musculature of body', 'limb'],
    'peripheral nervous system': ['nerve'],
    'reproductive system': ['gonad', 'ovary', 'penis', 'placenta', 'prostate gland', 'testis', 'uterus', 'vagina'],
    'respiratory system': ['trachea', 'bronchus', 'lung'],
    'sensory system': ['eye', 'nose', 'tongue'],
    'skeletal system': ['bone element', 'skeleton', 'bone marrow', 'limb'],
    'integumental system': ['mammary gland', 'skin of body'],
};

// Unhighlight all highlighted organ / inset image / systems terms and all highlighted svg paths / shapes and all highlighted inset images
const unHighlightOrgan = () => {
    const matchingElems = document.querySelectorAll('.highlight');
    matchingElems.forEach((el) => {
        el.classList.remove('highlight');
    });
};

// Add class "changedClass" to all elements that match input parameter string "matchingString"
// removeFlag = true will remove the class rather than add it
export const addingClass = (changedClass, matchingString, removeFlag = false) => {
    const matchingElems = document.querySelectorAll(`.${matchingString}`);
    if (removeFlag) {
        matchingElems.forEach((el) => {
            el.classList.remove(changedClass);
        });
    } else {
        matchingElems.forEach((el) => {
            el.classList.add(changedClass);
        });
    }
};

// Checks to see if "organ" is included in "selectedOrgan"
// checkClass is used to set an active class on buttons or images based on whether or not they are selected
const checkClass = (selectedOrgan, organ) => selectedOrgan.includes(organ);

// Set initialized body map diagram colors
export const initializeBodyMap = (terms, BodyList, associatedStates, assembly) => {
    let chromatinHierarchy;
    if (assembly === 'hg19') {
        chromatinHierarchy = Object.keys(initializedChromatinObjectHg19);
    } else {
        chromatinHierarchy = Object.keys(initializedChromatinObjectGRCh38);
    }

    if (terms.length > 0) {
        terms.forEach((term) => {
            if (BodyList[term]) {
                BodyList[term].forEach((bodyClass) => {
                    addingClass('active', bodyClass);
                });
            }
        });
    } else {
        Object.keys(BodyList).forEach((organ) => {
            BodyList[organ].forEach((bodyClass) => {
                addingClass('active', bodyClass, true);
            });
        });
    }
    if (Object.keys(associatedStates).length > 0) {
        Object.keys(associatedStates).forEach((term) => {
            if (BodyList[term]) {
                BodyList[term].forEach((bodyClass) => {
                    chromatinHierarchy.forEach((state) => {
                        addingClass(classString(sanitizedString(state)), bodyClass, true);
                    });
                    if (associatedStates[term]) {
                        addingClass(classString(sanitizedString(associatedStates[term])), bodyClass);
                    }
                    addingClass('bodymap-path', bodyClass);
                });
            } else if (HumanCellsList[term]) {
                chromatinHierarchy.forEach((state) => {
                    addingClass(classString(sanitizedString(state)), term.replace(' ', '-'), true);
                    document.getElementById(term).classList.remove(classString(sanitizedString(state)));
                });
                if (associatedStates[term]) {
                    addingClass(classString(sanitizedString(associatedStates[term])), term.replace(' ', '-'));
                    document.getElementById(term).classList.add(classString(sanitizedString(associatedStates[term])));
                }
            }
        });
    }
};

// The BodyMap component is comprised of several different elements:
// (1) List of system slims ("central nervous system", "skeletal system", "digestive system")
// (2) Diagram of body in svg format with selectable organs
// (3) List of organ slims selectable on body diagram ("adrenal gland", "bone element")
// (4) Inset images representing organ slims difficult to represent on a body diagram ("adipose tissue")
// (5) List of organ slims represented by inset images
// (6) A button (could be optional) to clear organ and system slims selected on BodyMap
// All of these components are responsive (they stack and change position relative to each other based on screen width)
export class BodyMap extends React.Component {
    constructor(props) {
        super(props);

        const BodyList = HumanList;
        const CellsList = HumanCellsList;

        this.state = {
            selectedOrgan: props.originalFilters,
            organFacets: Object.keys(props.facet.organ_slims).filter(k => props.facet.organ_slims[k] > 0),
        };
        this.CellsList = CellsList;
        this.BodyList = BodyList;
        this.svgClick = this.svgClick.bind(this);
        this.chooseOrgan = this.chooseOrgan.bind(this);
        this.clearOrgans = this.clearOrgans.bind(this);
        this.svgHighlight = this.svgHighlight.bind(this);
        this.highlightOrgan = this.highlightOrgan.bind(this);
    }

    componentDidMount() {
        initializeBodyMap(this.state.selectedOrgan, this.BodyList, this.props.facet.associatedStates, this.props.assembly);

        // Add a class to disable pointer events on paths associated with unavailable organ terms
        Object.keys(this.BodyList).forEach((b) => {
            const found = this.BodyList[b].some(r => this.state.organFacets.includes(r));
            if (this.state.organFacets.indexOf(b) === -1 && !(found)) {
                this.BodyList[b].forEach((path) => {
                    addingClass('disabled', path);
                });
            }
        });
    }

    // Highlight all of the svg paths / shapes corresponding to a hovered-over svg path / shape and highlight corresponding term(s)
    // Most organs are comprised of multiple svg paths and we want all of the corresponding svg components to highlight together
    // For example, when the user hovers over one kidney, we want both kidneys to highlight because both will be selected upon click
    // As another example, "musculature of body" is comprised of 7 paths right next to each other and it would be confusing for just one line or section to highlight on hover
    svgHighlight(e, BodyList) {
        // Remove existing highlights
        unHighlightOrgan();
        let svgClass = e.target.className.baseVal;
        if (svgClass) {
            e.target.className.baseVal = `${svgClass} highlight`;
            if (svgClass.split(' ').length > 1) {
                svgClass = svgClass.split(' ')[0];
            }
            Object.keys(BodyList).forEach((b) => {
                if (BodyList[b] === svgClass || BodyList[b].includes(svgClass)) {
                    // Highlight corresponding organ term
                    if (this.state.organFacets.includes(b)) {
                        document.getElementById(b).classList.add('highlight');
                    }
                    BodyList[b].forEach((bodyClass) => {
                        addingClass('highlight', bodyClass);
                        if (bodyClass.indexOf('cls') === -1 && this.state.organFacets.includes(bodyClass)) {
                            // Highlight corresponding organ term
                            document.getElementById(bodyClass).classList.add('highlight');
                        }
                    });
                }
            });
        }
    }

    // Highlight all of the paths corresponding to a particular organ / system / inset image term
    // Additionally, highlight any other associated terms
    // For example, if hovering over "large intestine", we want all "large intestine" svg components to highlight as well as the term "colon"
    // Hovering over a system term name should highlight all associated organ terms and inset image terms and their corresponding svg elements or inset images
    highlightOrgan(e, BodyList, CellsList) {
        const currentOrgan = e.target.id || e.target.parentNode.id;
        // Check inset images mapping to see if term exists in that object
        if (Object.keys(CellsList).includes(currentOrgan)) {
            addingClass('highlight', currentOrgan.replace(' ', '-'));
            document.getElementById(currentOrgan).classList.add('highlight');
        // If not, check organs mapping searching for the term
        } else {
            Object.keys(BodyList).forEach((b) => {
                if (b === currentOrgan) {
                    BodyList[b].forEach((bodyClass) => {
                        if (bodyClass.indexOf('cls') === -1 && this.state.organFacets.includes(bodyClass)) {
                            document.getElementById(bodyClass).classList.add('highlight');
                            const newBodyClass = BodyList[bodyClass];
                            if (!newBodyClass) {
                                addingClass('highlight', bodyClass);
                            } else {
                                newBodyClass.forEach((b2) => {
                                    addingClass('highlight', b2);
                                });
                            }
                        } else {
                            addingClass('highlight', bodyClass);
                        }
                    });
                }
            });
        }
    }

    chooseOrgan(e) {
        // Clicked-on organ or system term name is the "currentOrgan"
        const currentOrgan = e.target.id;

        // Selection of an organ or system term is a toggle
        // active = true corresponds to a term that should be selected now that the user has clicked
        // active = false corresponds to a term that should be de-selected now
        let active = true;
        if ((typeof this.state.selectedOrgan === 'string' && this.state.selectedOrgan === currentOrgan) || (typeof this.state.selectedOrgan !== 'string' && this.state.selectedOrgan.includes(currentOrgan))) {
            active = false;
        }

        // We need to keep track of (de)selected terms that may also necessitate other terms' (de)selection
        // For instance, selecting "central nervous system" will also select "brain" and "spinal cord"
        // Similarly, selecting "lung" will also select "brochus"
        const multipleAssociations = [];

        // User has selected a term, so all corresponding body map elements need to be selected
        // Any associated terms and their body map elements must also be selected
        if (active) {
            Object.keys(this.BodyList).forEach((b) => {
                if (b === e.target.id) {
                    this.BodyList[b].forEach((bodyClass) => {
                        if (bodyClass.indexOf('cls') === -1 && this.state.organFacets.includes(bodyClass)) {
                            multipleAssociations.push(bodyClass);
                            document.getElementById(bodyClass).classList.add('active');
                            const newBodyClass = this.BodyList[bodyClass];
                            if (!newBodyClass) {
                                addingClass('active', bodyClass);
                            } else {
                                newBodyClass.forEach((b2) => {
                                    addingClass('active', b2);
                                });
                            }
                        } else {
                            addingClass('active', bodyClass);
                        }
                    });
                }
            });
        // User has de-selected a term, so all corresponding body map elements need to be de-selected
        // Any associated terms and their body map elements must also be de-selected
        } else {
            Object.keys(this.BodyList).forEach((b) => {
                if (b === e.target.id) {
                    this.BodyList[b].forEach((bodyClass) => {
                        if (bodyClass.indexOf('cls') === -1 && this.state.organFacets.includes(bodyClass)) {
                            multipleAssociations.push(bodyClass);
                            document.getElementById(bodyClass).classList.remove('active');
                            const newBodyClass = this.BodyList[bodyClass];
                            if (!newBodyClass) {
                                // Removing "active" class (removeFlag = true)
                                addingClass('active', bodyClass, true);
                            } else {
                                newBodyClass.forEach((b2) => {
                                    // Removing "active" class (removeFlag = true)
                                    addingClass('active', b2, true);
                                });
                            }
                        } else {
                            // Removing "active" class (removeFlag = true)
                            addingClass('active', bodyClass, true);
                        }
                    });
                }
            });
        }

        const filteredMultipleAssociations = multipleAssociations.filter(assoc => this.state.organFacets.includes(assoc));

        // Update state based on whether or not the term (and its associated terms) are selected or de-selected
        // Here also we have extra cases to prevent spread syntax from spreading single terms
        // If there is no "currentOrgan" in state, we add the new organ and associated terms
        if (this.state.currentOrgan === []) {
            this.setState({
                selectedOrgan: [currentOrgan, ...filteredMultipleAssociations],
            }, () => {
                this.props.handleFilters(this.state.selectedOrgan);
            });
        // If the state already includes the term, we remove it and its associated terms from state
        } else if (this.state.selectedOrgan.includes(currentOrgan)) {
            if (typeof this.state.selectedOrgan !== 'string') {
                this.setState(prevState => ({
                    selectedOrgan: prevState.selectedOrgan.filter(organ => organ !== currentOrgan && !(filteredMultipleAssociations.includes(organ))) || [],
                }), () => {
                    this.props.handleFilters(this.state.selectedOrgan);
                });
            } else {
                this.setState({
                    selectedOrgan: [],
                }, () => {
                    this.props.handleFilters(this.state.selectedOrgan);
                });
            }
        // If there is already a "currentOrgan" in state but it does not include the clicked-on slim,
        // we add the organ and its associations to the state
        } else {
            let newState;
            if (typeof this.state.selectedOrgan !== 'string') {
                newState = [...this.state.selectedOrgan, ...filteredMultipleAssociations, currentOrgan];
            } else {
                newState = [this.state.selectedOrgan, ...filteredMultipleAssociations, currentOrgan];
            }
            // Just to keep state clean, we remove any possible duplicates here
            this.setState({
                selectedOrgan: [...new Set(newState)],
            }, () => {
                this.props.handleFilters(this.state.selectedOrgan);
            });
        }
    }

    // Clear all organ and system slims selections
    clearOrgans() {
        if (this.state.selectedOrgan.length !== 0) {
            // Clear terms from state and clear "active" class from organs
            this.setState({
                selectedOrgan: [],
            }, () => {
                this.props.handleFilters(this.state.selectedOrgan);
            });
            // Removing class "active" from all elements with an "active" class (removeFlag = true)
            addingClass('active', 'active', true);
        }
    }

    // Executes on click on SVG body map diagram
    svgClick(e) {
        // Clicked-on body map element class name is the "svgClass"
        // Strip out "highlight" class to get primary identifier of svg element
        let svgClass = e.target.className.baseVal.replace(' highlight', '');

        // We have to check to make sure a class exists because the SVG background has no class and we don't want any update to execute in that case
        if (svgClass) {
            // Selection of an organ is a toggle
            let active = true;
            // If the svg class contains "active", then we are de-selecting the organ
            const classArray = svgClass.split(' ');
            if (classArray.indexOf('active') > -1) {
                svgClass = svgClass.replace(' active', '');
                active = false;
            // If not, we are selecting the organ, an append an active class to it
            } else {
                e.target.className.baseVal = `${svgClass} active`;
            }

            // To determine the organ(s) to which the svg element corresponds, we loop through BodyList
            let newOrgan;
            if (svgClass.split(' ').length > 1) {
                svgClass = svgClass.split(' ')[0];
            }
            // An organ may have multiple associations and we want to be sure to highlight all the associated terms on click
            // For example, clicking on the "intestine" organ should also highlight the "colon" organ
            const multipleAssociations = [];
            Object.keys(this.BodyList).forEach((b) => {
                if (this.BodyList[b] === svgClass || this.BodyList[b].includes(svgClass)) {
                    // This is the new organ that we want to append to state
                    newOrgan = b;
                    // Make sure all svg elements associated with that organ are selected, not just the clicked-on element
                    if (active) {
                        this.BodyList[b].forEach((bodyClass) => {
                            addingClass('active', bodyClass);
                            if (bodyClass.indexOf('cls') === -1 && this.state.organFacets.includes(bodyClass)) {
                                multipleAssociations.push(bodyClass);
                                if (active) {
                                    document.getElementById(bodyClass).classList.add('active');
                                } else {
                                    document.getElementById(bodyClass).classList.remove('active');
                                }
                            }
                        });
                    // De-select all svg elements associated with clicked-on organ
                    } else {
                        this.BodyList[b].forEach((bodyClass) => {
                            // Removing "active" class (removeFlag = true)
                            addingClass('active', bodyClass, true);
                            if (bodyClass.indexOf('cls') === -1 && this.state.organFacets.includes(bodyClass)) {
                                multipleAssociations.push(bodyClass);
                                if (active) {
                                    document.getElementById(bodyClass).classList.add('active');
                                } else {
                                    document.getElementById(bodyClass).classList.remove('active');
                                }
                            }
                        });
                    }
                }
            });

            // There can be the case where the user is selecting the skeleton element and "bone element" is available but "skeleton" is disabled, and this handles that case
            const newOrgansCombined = [newOrgan, ...multipleAssociations].filter(organ => this.state.organFacets.includes(organ));

            // Set state to be new organ and any other matches
            // We need to check if there is a new organ found because there are a very very few shapes that do not have corresponding organ_slims and in that case we do not want to add an undefined value to the state
            // For example, the uterine walls and vas deferens shapes do not correspond to any organ slim
            if (newOrgansCombined.length > 0) {
                // If there is no "currentOrgan" in state, we add the new organ and its associated terms
                if (this.state.currentOrgan === []) {
                    this.setState({
                        selectedOrgan: newOrgansCombined,
                    }, () => {
                        this.props.handleFilters(this.state.selectedOrgan);
                    });
                // If the state already includes the newly selected organ, we remove it and its associated terms
                } else if (this.state.selectedOrgan.includes(newOrgan)) {
                    if (typeof this.state.selectedOrgan !== 'string') {
                        this.setState(prevState => ({
                            selectedOrgan: prevState.selectedOrgan.filter(organ => !(newOrgansCombined.includes(organ))) || [],
                        }), () => {
                            this.props.handleFilters(this.state.selectedOrgan);
                        });
                    } else {
                        this.setState({
                            selectedOrgan: [],
                        }, () => {
                            this.props.handleFilters(this.state.selectedOrgan);
                        });
                    }
                // If there already is a "currentOrgan" but it does not include the clicked-on organ, add the new organ and its associations
                } else {
                    let newState;
                    if (typeof this.state.selectedOrgan !== 'string') {
                        newState = [...this.state.selectedOrgan, ...newOrgansCombined];
                    } else {
                        newState = [this.state.selectedOrgan, ...newOrgansCombined];
                    }
                    this.setState({
                        selectedOrgan: [...new Set(newState)],
                    }, () => {
                        this.props.handleFilters(this.state.selectedOrgan);
                    });
                }
            }
        }
    }

    render() {
        return (
            <div className={`body-facet-container ${this.props.organism.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="body-facet">
                    <div className="body-image-container">
                        <HumanBodyDiagram
                            handleClick={this.svgClick}
                            handleHighlight={this.svgHighlight}
                            BodyList={this.BodyList}
                        />
                    </div>
                    <div className="body-list">
                        <ul className="body-list-inner">
                            {Object.keys(this.BodyList).map(b => (
                                <li key={`${b}-bodymap-organlist`}>
                                    <span
                                        id={b}
                                        className={`body-list-element ${checkClass(this.state.selectedOrgan, b) ? 'active' : ''}`}
                                        role="button"
                                        tabIndex="0"
                                        onClick={e => this.chooseOrgan(e)}
                                        onKeyPress={e => this.chooseOrgan(e)}
                                        onMouseEnter={e => this.highlightOrgan(e, this.BodyList, this.CellsList, this.SystemsList)}
                                        onMouseLeave={unHighlightOrgan}
                                        disabled={this.state.organFacets.indexOf(b) === -1}
                                    >
                                        {b}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="body-inset-container">
                        {Object.keys(this.CellsList).map(image => (
                            <button
                                type="button"
                                id={image}
                                className={`body-inset ${image.replace(' ', '-')} ${checkClass(this.state.selectedOrgan, image) ? 'active' : ''}`}
                                onClick={e => this.chooseOrgan(e)}
                                onMouseEnter={e => this.highlightOrgan(e, this.BodyList, this.CellsList, this.SystemsList)}
                                onMouseLeave={unHighlightOrgan}
                                key={`${image}-bodymap-cellslist`}
                                disabled={this.state.organFacets.indexOf(image) === -1}
                            >
                                {((['lymph node', 'lymphatic vessel']).indexOf(image) > -1) ?
                                    <img src={`/static/img/bodyMap/insetSVGs/${image.replace(' ', '_')}.png`} alt={image} />
                                :
                                    <img src={`/static/img/bodyMap/insetSVGs/${image.replace(' ', '_')}.svg`} alt={image} />
                                }
                                <div className="overlay" />
                            </button>
                        ))}
                    </div>
                    <div className="body-list body-list-narrow">
                        <ul className="body-list-inner">
                            {Object.keys(this.CellsList).map(b => (
                                <li key={`${b}-bodymap-cellslist`}>
                                    <span
                                        id={b}
                                        className={`body-list-element ${b.replace(' ', '-')} ${checkClass(this.state.selectedOrgan, b) ? 'active' : ''}`}
                                        role="button"
                                        tabIndex="0"
                                        onClick={e => this.chooseOrgan(e)}
                                        onKeyPress={e => this.chooseOrgan(e)}
                                        onMouseEnter={e => this.highlightOrgan(e, this.BodyList, this.CellsList)}
                                        onMouseLeave={unHighlightOrgan}
                                        disabled={this.state.organFacets.indexOf(b) === -1}
                                    >
                                        {b}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}

BodyMap.propTypes = {
    facet: PropTypes.array.isRequired,
    organism: PropTypes.string.isRequired,
    handleFilters: PropTypes.func.isRequired,
    originalFilters: PropTypes.array.isRequired,
    assembly: PropTypes.string.isRequired,
};

// Clickable thumbnail
// Comprised of body map svg and inset images, with expand icon and instructions
// Button to display the actual body map facet <BodyMapModal>
export const ClickableThumbnail = (props) => {
    // "toggleThumbnail" toggles whether or not the pop-up is displayed
    const { toggleThumbnail, organism } = props;
    const CellsList = HumanCellsList;

    return (
        <React.Fragment>
            <div
                role="button"
                tabIndex={0}
                className="body-image-thumbnail"
                onClick={() => toggleThumbnail()}
                onKeyDown={() => toggleThumbnail()}
            >
                <div className="body-map-expander">Filter results by body diagram</div>
                {svgIcon('expandArrows')}
                {organism === 'Homo sapiens' ?
                    <HumanBodyDiagram
                        BodyList={HumanList}
                    />
                : null}
                <div className="body-list body-list-narrow">
                    <ul className="body-list-inner">
                        {Object.keys(CellsList).map(image => (
                            <li
                                className={`body-inset ${image}`}
                                id={image}
                                key={`${image}-bodymap-cellslist`}
                            >
                                {((['lymph node', 'lymphatic vessel']).indexOf(image) > -1) ?
                                    <img src={`/static/img/bodyMap/insetSVGs/${image.replace(' ', '_')}.png`} alt={image} />
                                :
                                    <img src={`/static/img/bodyMap/insetSVGs/${image.replace(' ', '_')}.svg`} alt={image} />
                                }
                                <div className="overlay" />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </React.Fragment>
    );
};

ClickableThumbnail.propTypes = {
    toggleThumbnail: PropTypes.func.isRequired,
    organism: PropTypes.string.isRequired,
};

// Pop-up body map facet
// Displayed when you click on <ClickableThumbnail>
// Allows you to select organ / system filters
export const BodyMapModal = (props) => {
    const { facet, isThumbnailExpanded, toggleThumbnail, organism, handleFilters, originalFilters, assembly } = props;
    const [mapFacet, setFacet] = useState(facet);

    useEffect(() => {
        setFacet(props.facet);
    }, [props.facet]);

    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className={`body-map-container-pop-up ${isThumbnailExpanded ? 'expanded' : 'collapsed'}`}>
                <button type="button" className="collapse-body-map" onClick={() => toggleThumbnail()}>
                    {svgIcon('collapseArrows')}
                    <div className="body-map-collapser">Hide body diagram</div>
                </button>
                <div className="clickable-diagram-container">
                    <BodyMap
                        key={facet.organ_slims}
                        facet={mapFacet}
                        organism={organism}
                        handleFilters={handleFilters}
                        originalFilters={originalFilters}
                        assembly={assembly}
                    />
                </div>
                <div className="spacer" />
            </div>
            <div className="modal-backdrop in" />
        </div>
    );
};

BodyMapModal.propTypes = {
    isThumbnailExpanded: PropTypes.bool.isRequired,
    toggleThumbnail: PropTypes.func.isRequired,
    facet: PropTypes.array.isRequired,
    organism: PropTypes.string.isRequired,
    handleFilters: PropTypes.func.isRequired,
    originalFilters: PropTypes.array.isRequired,
    assembly: PropTypes.string.isRequired,
};

// Combining the body map thumbnail and the body map modal into one component
export const BodyMapThumbnailAndModal = (props) => {
    const [isThumbnailExpanded, setIsThumbnailExpanded] = React.useState(false);
    const [facet, setFacet] = React.useState(props.facet);

    const BodyList = HumanList;
    const CellsList = HumanCellsList;

    React.useEffect(() => {
        Object.keys(CellsList).forEach((cell) => {
            document.getElementById(cell).classList.remove('active');
        });

        // Highlight body map selections
        initializeBodyMap(props.originalFilters, BodyList, props.facet.associatedStates, props.assembly);
        props.originalFilters.forEach((term) => {
            if (CellsList[term] && document.getElementById(term)) {
                document.getElementById(term).classList.add('active');
            }
        });
    }, [setIsThumbnailExpanded, props.originalFilters]);


    const toggleThumbnail = () => {
        setIsThumbnailExpanded(!isThumbnailExpanded);
    };

    React.useEffect(() => {
        setFacet(props.facet);
        // Highlight body map selections
        initializeBodyMap(props.originalFilters, BodyList, props.facet.associatedStates, props.assembly);
    }, [props.facet, props.originalFilters]);

    return (
        <div className="body-map-thumbnail-and-modal">
            <ClickableThumbnail
                key={facet.organ_slims}
                toggleThumbnail={toggleThumbnail}
                organism={props.organism}
            />
            {isThumbnailExpanded ?
                <BodyMapModal
                    key={facet.organ_slims + 2}
                    isThumbnailExpanded
                    toggleThumbnail={toggleThumbnail}
                    facet={facet}
                    organism={props.organism}
                    handleFilters={props.handleFilters}
                    originalFilters={props.originalFilters}
                    assembly={props.assembly}
                />
            : null}
        </div>
    );
};

BodyMapThumbnailAndModal.propTypes = {
    facet: PropTypes.array.isRequired,
    organism: PropTypes.string.isRequired,
    handleFilters: PropTypes.func.isRequired,
    originalFilters: PropTypes.array.isRequired,
    assembly: PropTypes.string.isRequired,
};
