"""
Summary Formatter Module

Creates unified summaries of facial feature analysis results.
Provides clean, consolidated data for frontend consumption and YouTube search queries.
"""

from typing import Dict, List


class SummaryFormatter:
    """
    Formats facial analysis results into unified summaries
    """

    def __init__(self):
        """Initialize the summary formatter"""
        pass

    def create_summary(
        self,
        eye_analysis: Dict,
        nose_analysis: Dict,
        lip_analysis: Dict
    ) -> Dict:
        """
        Create a unified summary of all facial feature analyses

        Args:
            eye_analysis: Eye shape classification results
            nose_analysis: Nose width classification results
            lip_analysis: Lip fullness classification results

        Returns:
            Dictionary containing unified summary
        """
        # Extract primary features
        features = {
            'eye_shape': eye_analysis['eye_shape'],
            'nose_width': nose_analysis['nose_width'],
            'lip_fullness': lip_analysis['lip_fullness']
        }

        # Add secondary features if present
        if eye_analysis.get('secondary_features'):
            features['eye_secondary'] = eye_analysis['secondary_features']

        # Add lip balance
        features['lip_balance'] = lip_analysis.get('details', {}).get('lip_balance', 'balanced')

        # Calculate overall confidence
        confidences = [
            max(eye_analysis['confidence_scores'].values()),
            nose_analysis['confidence'],
            lip_analysis['confidence']
        ]
        overall_confidence = sum(confidences) / len(confidences)

        # Generate search tags for YouTube/content scraping
        search_tags = self._generate_search_tags(features)

        # Generate makeup recommendations keywords
        makeup_keywords = self._generate_makeup_keywords(features)

        # Create description
        description = self._generate_description(features)

        return {
            'features': features,
            'overall_confidence': overall_confidence,
            'search_tags': search_tags,
            'makeup_keywords': makeup_keywords,
            'description': description,
            'feature_summary': self._create_feature_summary(features)
        }

    def _generate_search_tags(self, features: Dict) -> List[str]:
        """
        Generate search tags for YouTube content scraping

        Args:
            features: Dictionary of classified features

        Returns:
            List of search tag strings
        """
        tags = []

        # Base tag combining all features
        base_features = f"{features['eye_shape']} eyes {features['nose_width']} nose {features['lip_fullness']} lips"
        tags.append(base_features)

        # Individual feature tags
        tags.append(f"{features['eye_shape']} eye makeup")
        tags.append(f"{features['nose_width']} nose makeup")
        tags.append(f"{features['lip_fullness']} lips makeup")

        # Add secondary features if present
        if 'eye_secondary' in features:
            for secondary in features['eye_secondary']:
                tags.append(f"{secondary} eyes makeup")

        # Combination tags for better search results
        tags.append(f"{features['eye_shape']} {features.get('eye_secondary', [''])[0] if features.get('eye_secondary') else ''} eyes".strip())
        tags.append(f"makeup for {features['nose_width']} nose")
        tags.append(f"makeup for {features['lip_fullness']} lips")

        # Specific makeup technique tags
        tags.extend(self._get_technique_tags(features))

        return tags

    def _generate_makeup_keywords(self, features: Dict) -> Dict[str, List[str]]:
        """
        Generate makeup-specific keywords for each feature

        Args:
            features: Dictionary of classified features

        Returns:
            Dictionary mapping feature categories to keyword lists
        """
        keywords = {
            'eye': self._get_eye_keywords(features),
            'nose': self._get_nose_keywords(features),
            'lip': self._get_lip_keywords(features)
        }

        return keywords

    def _get_eye_keywords(self, features: Dict) -> List[str]:
        """Get makeup keywords specific to eye shape"""
        eye_shape = features['eye_shape']
        secondary = features.get('eye_secondary', [])

        keywords = [eye_shape, 'eye makeup', 'eyeshadow']

        # Add shape-specific keywords
        if eye_shape == 'Almond':
            keywords.extend(['winged eyeliner', 'cat eye', 'smokey eye'])
        elif eye_shape == 'Round':
            keywords.extend(['elongating', 'lengthening', 'outer corner emphasis'])
        elif eye_shape == 'Monolid':
            keywords.extend(['monolid tutorial', 'tightlining', 'gradient eye'])
        elif eye_shape == 'Hooded':
            keywords.extend(['hooded eye tutorial', 'cut crease', 'halo eye'])

        # Add secondary feature keywords
        if 'Upturned' in secondary:
            keywords.extend(['upturned', 'lifted', 'fox eye'])
        elif 'Downturned' in secondary:
            keywords.extend(['downturned', 'puppy eye', 'lifting technique'])

        return keywords

    def _get_nose_keywords(self, features: Dict) -> List[str]:
        """Get makeup keywords specific to nose width"""
        nose_width = features['nose_width']

        keywords = [nose_width, 'nose contour', 'nose makeup']

        if nose_width == 'narrow':
            keywords.extend(['highlight bridge', 'widen nose', 'side highlight'])
        elif nose_width == 'medium':
            keywords.extend(['natural contour', 'subtle definition'])
        elif nose_width == 'wide':
            keywords.extend(['slim nose', 'nose contour', 'bridge highlight'])

        return keywords

    def _get_lip_keywords(self, features: Dict) -> List[str]:
        """Get makeup keywords specific to lip fullness"""
        lip_fullness = features['lip_fullness']
        lip_balance = features.get('lip_balance', 'balanced')

        keywords = [lip_fullness, 'lip makeup', 'lipstick']

        if lip_fullness == 'thin':
            keywords.extend(['plump lips', 'lip liner', 'overlining', 'fuller lips'])
        elif lip_fullness == 'medium':
            keywords.extend(['natural lip', 'lip definition'])
        elif lip_fullness == 'full':
            keywords.extend(['full lips', 'matte lipstick', 'lip stain'])

        # Add balance-specific keywords
        if 'upper' in lip_balance:
            keywords.append('balance lower lip')
        elif 'lower' in lip_balance:
            keywords.append('balance upper lip')

        return keywords

    def _get_technique_tags(self, features: Dict) -> List[str]:
        """Generate makeup technique tags based on features"""
        techniques = []

        eye_shape = features['eye_shape']

        # Eye-specific techniques
        if eye_shape == 'Hooded':
            techniques.append('cut crease tutorial')
        elif eye_shape == 'Monolid':
            techniques.append('monolid eyeshadow technique')
        elif eye_shape == 'Round':
            techniques.append('elongating eye makeup')

        # Nose contouring
        techniques.append(f"{features['nose_width']} nose contour tutorial")

        # Lip techniques
        if features['lip_fullness'] == 'thin':
            techniques.append('lip plumping technique')
        elif features['lip_fullness'] == 'full':
            techniques.append('full lip makeup tutorial')

        return techniques

    def _generate_description(self, features: Dict) -> str:
        """
        Generate a human-readable description of the facial features

        Args:
            features: Dictionary of classified features

        Returns:
            String description
        """
        eye_desc = features['eye_shape']
        if 'eye_secondary' in features:
            eye_desc += f" {features['eye_secondary'][0].lower()}"

        description = (
            f"Your facial features include {eye_desc} eyes, "
            f"a {features['nose_width']} nose, and "
            f"{features['lip_fullness']} lips"
        )

        # Add lip balance note if significant
        if 'dominant' in features['lip_balance']:
            balance_note = features['lip_balance'].replace('_', ' ')
            description += f" with a {balance_note} lip balance"

        description += "."

        return description

    def _create_feature_summary(self, features: Dict) -> Dict:
        """
        Create a clean feature summary for quick reference

        Args:
            features: Dictionary of classified features

        Returns:
            Dictionary with categorized features
        """
        summary = {
            'eyes': {
                'primary': features['eye_shape'],
                'secondary': features.get('eye_secondary', [])
            },
            'nose': {
                'width': features['nose_width']
            },
            'lips': {
                'fullness': features['lip_fullness'],
                'balance': features['lip_balance']
            }
        }

        return summary
