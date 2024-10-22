import * as handpose from "@tensorflow-models/handpose"; // getPose1
// import "@tensorflow/tfjs-backend-webgl";
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'; // getPose2
import '@tensorflow/tfjs-core'; // getPose1
// import '@tensorflow/tfjs-converter';
// import '@mediapipe/hands'
// import * as tf from "@tensorflow/tfjs";

class PoseEstimator {
    constructor() {
        this.detector;
    }

    estimate(video) {
        // Method to be implemented by subclasses
    }
}

export class BrowserPoseEstimator extends PoseEstimator {
    init = async () => {
        // console.log(`Loading the model 1...`)
        this.detector = await handpose.load();
        // console.log(`Model loaded...`)
    }

    estimate = async (video) => {
        const handData = await this.detector.estimateHands(video);
        return handData;
    }
}

export class MobilePoseEstimator extends PoseEstimator {
    init = async () => {
        // console.log(`Loading model 2...`)
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
            runtime: 'mediapipe', // or 'tfjs',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
            modelType: 'full'
        };
        this.detector = await handPoseDetection.createDetector(model, detectorConfig);
        // console.log(`Model loaded...`)
    }

    estimate = async (video) => {
        const result = await this.detector.estimateHands(video);
        if (result && result.length > 0) {
            const lm = this.formatOutput(result);
            const handData = [{
                boundingBox: {
                    topLeft: [0, 0],
                    bottomRight: [600, 600],
                },
                landmarks: lm
            }];
            return handData;
        }
        return null;
    }

    formatOutput(pose) {
        // TODO: try the accuracy with left and right hands
        // console.log(`pose 2: ${JSON.stringify(pose)}`)
        const lm = pose[0].keypoints;

        // TODO: compare the order with the alternative methods output 
        // TODO: get the correct value for z
        const formatted = lm.map(point => [point.x, point.y, 0]);
        // console.log(formatted)

        // For the keypoints3D, x, y and z represent absolute distance in a metric scale, 
        // where the origin is formed as an average between the first knuckles of index, 
        // middle, ring and pinky fingers.
        // https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection
        return formatted;
    }
}

let estimator;
export const getPose2 = async (video, isMobile) => {
    if (!estimator) {
        if (isMobile)
            estimator = new MobilePoseEstimator();
        else
            estimator = new BrowserPoseEstimator();
        await estimator.init();
    }
    const handData = await estimator.estimate(video);
    return handData;
};
