import React, {FC} from 'react';
import styled from 'styled-components/native';
import Swipeout from 'react-native swipeout';

interface Props {
  text: string;
}

const TextItem: FC<Props> = ({text}) => {
  return <StyledText>{text}</StyledText>;
};

const StyledText = styled.Text`
  font-size: 20px;
`;

const SwipeList = styled(Swipeout)`
  width: 100%;
`;

export default TextItem;