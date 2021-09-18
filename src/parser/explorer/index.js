/**
 *@fileoverview Exposes all the exploration-related functions through main object
 *@author Raghav Dua
 */

'use strict';

var SolExplore = {
	traverse: require ('./traverse'),
	traversalOptions: require ('./traversalOptions'),
	Syntax: require ('./syntax'),
	version: "1.0.1"
};

if (typeof window !== 'undefined') {
	window.SolExplore = SolExplore;
}

module.exports = SolExplore;